import React, { useState, useEffect } from "react";
import { PanelSheet } from "../panel-sheet";
import { SheetHeader } from "../sheet-header";
import { useVaultStore } from "../../vault/vault-store";
import { hapticTick } from "../../timeline/haptics";
import {
	Lock,
	Unlock,
	Key,
	Eye,
	EyeOff,
	RotateCcw,
	Check,
	ShieldCheck,
	Sparkles,
	Mic,
	Film,
	Delete,
} from "lucide-react";
import { CC_ICON_STROKE } from "../../tokens";

interface KeyVaultSheetProps {
	onClose: () => void;
}

export function KeyVaultSheet({ onClose }: KeyVaultSheetProps) {
	const isConfigured = useVaultStore((s) => s.isConfigured);
	const isUnlocked = useVaultStore((s) => s.isUnlocked);
	const keys = useVaultStore((s) => s.keys);
	const error = useVaultStore((s) => s.error);
	const setupVault = useVaultStore((s) => s.setupVault);
	const unlock = useVaultStore((s) => s.unlock);
	const lock = useVaultStore((s) => s.lock);
	const updateKeys = useVaultStore((s) => s.updateKeys);
	const changePin = useVaultStore((s) => s.changePin);
	const clearError = useVaultStore((s) => s.clearError);
	const touchActivity = useVaultStore((s) => s.touchActivity);

	// PIN pad input state
	const [pinInput, setPinInput] = useState("");
	const [confirmPinInput, setConfirmPinInput] = useState("");
	const [isConfirmingSetup, setIsConfirmingSetup] = useState(false);
	const [isChangingPin, setIsChangingPin] = useState(false);
	const [oldPinForChange, setOldPinForChange] = useState("");

	// Key fields state (in unlocked mode)
	const [anthropicKey, setAnthropicKey] = useState(keys.anthropic ?? "");
	const [elevenlabsKey, setElevenlabsKey] = useState(keys.elevenlabs ?? "");
	const [pexelsKey, setPexelsKey] = useState(keys.pexels ?? "");
	const [showAnthropic, setShowAnthropic] = useState(false);
	const [showElevenlabs, setShowElevenlabs] = useState(false);
	const [showPexels, setShowPexels] = useState(false);
	const [savedNotice, setSavedNotice] = useState<string | null>(null);

	// Sync local inputs when keys change
	useEffect(() => {
		if (isUnlocked) {
			setAnthropicKey(keys.anthropic ?? "");
			setElevenlabsKey(keys.elevenlabs ?? "");
			setPexelsKey(keys.pexels ?? "");
		}
	}, [isUnlocked, keys]);

	const handleDigit = (digit: string) => {
		hapticTick();
		clearError();
		touchActivity();

		if (!isConfigured || isChangingPin) {
			if (!isConfirmingSetup) {
				if (pinInput.length < 4) {
					const next = pinInput + digit;
					setPinInput(next);
					if (next.length === 4) {
						setIsConfirmingSetup(true);
					}
				}
			} else {
				if (confirmPinInput.length < 4) {
					const next = confirmPinInput + digit;
					setConfirmPinInput(next);
					if (next.length === 4) {
						void handleCompleteSetup(pinInput, next);
					}
				}
			}
		} else {
			// Unlocking mode
			if (pinInput.length < 4) {
				const next = pinInput + digit;
				setPinInput(next);
				if (next.length === 4) {
					void handleAttemptUnlock(next);
				}
			}
		}
	};

	const handleBackspace = () => {
		hapticTick();
		clearError();
		touchActivity();

		if (!isConfigured || isChangingPin) {
			if (isConfirmingSetup) {
				if (confirmPinInput.length > 0) {
					setConfirmPinInput(confirmPinInput.slice(0, -1));
				} else {
					setIsConfirmingSetup(false);
				}
			} else {
				setPinInput(pinInput.slice(0, -1));
			}
		} else {
			setPinInput(pinInput.slice(0, -1));
		}
	};

	const handleAttemptUnlock = async (pinToTry: string) => {
		const success = await unlock(pinToTry);
		if (!success) {
			setPinInput("");
		}
	};

	const handleCompleteSetup = async (pin1: string, pin2: string) => {
		if (pin1 !== pin2) {
			useVaultStore.setState({ error: "PINs do not match. Please try again." });
			setPinInput("");
			setConfirmPinInput("");
			setIsConfirmingSetup(false);
			return;
		}

		if (isChangingPin) {
			const success = await changePin(oldPinForChange, pin1);
			if (success) {
				setIsChangingPin(false);
				setOldPinForChange("");
				setPinInput("");
				setConfirmPinInput("");
				setIsConfirmingSetup(false);
				setSavedNotice("PIN changed successfully.");
				setTimeout(() => setSavedNotice(null), 3000);
			}
		} else {
			const success = await setupVault(pin1, {
				anthropic: anthropicKey,
				elevenlabs: elevenlabsKey,
				pexels: pexelsKey,
			});
			if (success) {
				setPinInput("");
				setConfirmPinInput("");
				setIsConfirmingSetup(false);
			}
		}
	};

	const handleSaveKeys = async () => {
		touchActivity();
		const success = await updateKeys({
			anthropic: anthropicKey.trim(),
			elevenlabs: elevenlabsKey.trim(),
			pexels: pexelsKey.trim(),
		});
		if (success) {
			setSavedNotice("Keys encrypted & saved.");
			setTimeout(() => setSavedNotice(null), 3000);
		}
	};

	const activeDisplayPin =
		(!isConfigured || isChangingPin) && isConfirmingSetup ? confirmPinInput : pinInput;

	return (
		<PanelSheet
			onScrimClick={onClose}
			header={
				<SheetHeader
					title="Key Vault"
					onClose={onClose}
				/>
			}
		>
			{!isUnlocked ? (
				/* ── PIN PAD VIEW ── */
				<div className="cc-vault-pin-view">
					<div className="cc-vault-badge">
						<Lock size={16} strokeWidth={CC_ICON_STROKE} />
						<span>AES-256 Encrypted Vault</span>
					</div>

					<p className="cc-vault-title">
						{!isConfigured
							? isConfirmingSetup
								? "Confirm your 4-digit PIN"
								: "Create your 4-digit PIN"
							: isChangingPin
								? isConfirmingSetup
									? "Confirm new 4-digit PIN"
									: "Enter new 4-digit PIN"
								: "Enter PIN to unlock"}
					</p>
					<p className="cc-vault-subtitle">
						{!isConfigured
							? "Protect your paid API keys from unauthorized access."
							: isChangingPin
								? "Choose a 4-digit PIN you will remember."
								: "Keys are encrypted at rest with hardware AES-GCM."}
					</p>

					{/* 4-Digit Dots Indicator */}
					<div className="cc-vault-dots">
						{[0, 1, 2, 3].map((idx) => (
							<div
								key={idx}
								className={`cc-vault-dot ${
									idx < activeDisplayPin.length ? "cc-vault-dot--filled" : ""
								}`}
							/>
						))}
					</div>

					{error && <p className="cc-vault-error">{error}</p>}

					{/* 3x4 Numeric Keypad */}
					<div className="cc-vault-keypad">
						{[1, 2, 3, 4, 5, 6, 7, 8, 9].map((num) => (
							<button
								key={num}
								type="button"
								onClick={() => handleDigit(String(num))}
								className="cc-vault-key"
							>
								{num}
							</button>
						))}
						<button
							type="button"
							onClick={() => {
								setPinInput("");
								setConfirmPinInput("");
								setIsConfirmingSetup(false);
								clearError();
							}}
							className="cc-vault-key cc-vault-key--action"
						>
							C
						</button>
						<button
							type="button"
							onClick={() => handleDigit("0")}
							className="cc-vault-key"
						>
							0
						</button>
						<button
							type="button"
							onClick={handleBackspace}
							className="cc-vault-key cc-vault-key--action"
							aria-label="Delete"
						>
							<Delete size={20} strokeWidth={CC_ICON_STROKE} />
						</button>
					</div>
				</div>
			) : (
				/* ── UNLOCKED KEY VAULT MANAGEMENT VIEW ── */
				<div className="cc-vault-unlocked-view">
					{/* Status & Actions Header */}
					<div className="cc-vault-status-header">
						<div className="cc-vault-status-badge">
							<ShieldCheck size={14} color="var(--cc-accent)" />
							<span>Vault Unlocked · Auto-locks in 60s</span>
						</div>
						<div style={{ display: "flex", gap: "6px" }}>
							<button
								type="button"
								onClick={() => {
									const old = useVaultStore.getState().activePin;
									if (old) {
										setOldPinForChange(old);
										setIsChangingPin(true);
										setPinInput("");
										setConfirmPinInput("");
										setIsConfirmingSetup(false);
										lock();
									}
								}}
								className="cc-vault-sm-btn"
							>
								Change PIN
							</button>
							<button
								type="button"
								onClick={lock}
								className="cc-vault-sm-btn cc-vault-sm-btn--accent"
							>
								Lock Now
							</button>
						</div>
					</div>

					{savedNotice && <p className="cc-vault-notice">{savedNotice}</p>}
					{error && <p className="cc-vault-error">{error}</p>}

					{/* 1. Anthropic Claude Key */}
					<div className="cc-vault-card">
						<div className="cc-vault-card__header">
							<div className="cc-vault-card__icon-badge">
								<Sparkles size={14} color="var(--cc-accent)" />
							</div>
							<div style={{ flex: 1 }}>
								<h4 className="cc-vault-card__title">Anthropic Claude API</h4>
								<p className="cc-vault-card__desc">Powers the AI Director, vision, and script planning.</p>
							</div>
						</div>
						<div className="cc-vault-input-row">
							<input
								type={showAnthropic ? "text" : "password"}
								value={anthropicKey}
								onChange={(e) => {
									setAnthropicKey(e.target.value);
									touchActivity();
								}}
								placeholder="sk-ant-api03-..."
								className="cc-text-content-input"
							/>
							<button
								type="button"
								onClick={() => setShowAnthropic(!showAnthropic)}
								className="cc-vault-eye-btn"
								aria-label={showAnthropic ? "Hide" : "Show"}
							>
								{showAnthropic ? <EyeOff size={16} /> : <Eye size={16} />}
							</button>
						</div>
					</div>

					{/* 2. ElevenLabs Key */}
					<div className="cc-vault-card">
						<div className="cc-vault-card__header">
							<div className="cc-vault-card__icon-badge">
								<Mic size={14} color="#10b981" />
							</div>
							<div style={{ flex: 1 }}>
								<h4 className="cc-vault-card__title">ElevenLabs API</h4>
								<p className="cc-vault-card__desc">Lifelike premium narration and custom voice cloning.</p>
							</div>
						</div>
						<div className="cc-vault-input-row">
							<input
								type={showElevenlabs ? "text" : "password"}
								value={elevenlabsKey}
								onChange={(e) => {
									setElevenlabsKey(e.target.value);
									touchActivity();
								}}
								placeholder="xi-..."
								className="cc-text-content-input"
							/>
							<button
								type="button"
								onClick={() => setShowElevenlabs(!showElevenlabs)}
								className="cc-vault-eye-btn"
								aria-label={showElevenlabs ? "Hide" : "Show"}
							>
								{showElevenlabs ? <EyeOff size={16} /> : <Eye size={16} />}
							</button>
						</div>
					</div>

					{/* 3. Pexels Key */}
					<div className="cc-vault-card">
						<div className="cc-vault-card__header">
							<div className="cc-vault-card__icon-badge">
								<Film size={14} color="#f59e0b" />
							</div>
							<div style={{ flex: 1 }}>
								<h4 className="cc-vault-card__title">Pexels Stock Media API</h4>
								<p className="cc-vault-card__desc">Free HD stock footage and photos for B-roll insertion.</p>
							</div>
						</div>
						<div className="cc-vault-input-row">
							<input
								type={showPexels ? "text" : "password"}
								value={pexelsKey}
								onChange={(e) => {
									setPexelsKey(e.target.value);
									touchActivity();
								}}
								placeholder="Pexels API key"
								className="cc-text-content-input"
							/>
							<button
								type="button"
								onClick={() => setShowPexels(!showPexels)}
								className="cc-vault-eye-btn"
								aria-label={showPexels ? "Hide" : "Show"}
							>
								{showPexels ? <EyeOff size={16} /> : <Eye size={16} />}
							</button>
						</div>
					</div>

					{/* Save Button */}
					<button
						type="button"
						onClick={handleSaveKeys}
						className="cc-panel-cta"
						style={{ marginTop: "8px" }}
					>
						<Check size={16} strokeWidth={CC_ICON_STROKE} />
						<span>Encrypt & Save Keys</span>
					</button>
				</div>
			)}
		</PanelSheet>
	);
}
