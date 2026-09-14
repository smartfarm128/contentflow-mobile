"use client";

import { useMemo } from "react";
import type { HtmlTemplateProps } from "../types";

export function ToggleSwitchTemplate({ time, values }: HtmlTemplateProps) {
  const cycleDuration = Number(values.cycleDuration ?? 3.0);

  const isChecked = useMemo(() => {
    return Math.floor(time / cycleDuration) % 2 === 0;
  }, [time, cycleDuration]);

  // Generate a unique ID to avoid conflicts
  const switchId = useMemo(() => `template-switch-${Math.floor(time * 1000)}`, [time]);

  return (
    <div className="flex h-full w-full items-center justify-center p-4 bg-zinc-950 rounded-2xl border border-zinc-800">
      <div className="analog-switch-template inline-block select-none">
        <style dangerouslySetInnerHTML={{ __html: `
          .analog-switch-template .switch {
            background-color: rgba(0, 0, 0, 0.4);
            border-radius: 30px;
            border: 4px solid rgba(58, 58, 58, 0.2);
            box-shadow: 0 0 6px rgba(0, 0, 0, 0.5) inset;
            height: 48px;
            margin: 2px;
            position: relative;
            width: 120px;
            display: inline-block;
            user-select: none;
          }

          .analog-switch-template .switch-check {
            position: absolute;
            visibility: hidden;
            user-select: none;
          }

          .analog-switch-template .switch-label {
            cursor: pointer;
            display: block;
            height: 42px;
            text-indent: -9999px;
            width: 115px;
            user-select: none;
          }

          .analog-switch-template .switch-label:before {
            background: #fff;
            background: -webkit-radial-gradient(45%, circle, rgb(255, 58, 58) 0%, rgb(255, 113, 113) 100%);
            border-radius: 10px;
            border: 1px solid #742323;
            box-shadow: 0 2px 5px rgba(255, 67, 48, 0.6), 0 0 5px rgba(255, 159, 109, 0.5) inset;
            content: "";
            display: block;
            height: 10px;
            left: -20px;
            position: absolute;
            top: 15px;
            transition: all 0.2s;
            width: 10px;
            z-index: 12;
            user-select: none;
          }

          .analog-switch-template .switch-label:after {
            background: #fff;
            background: -webkit-radial-gradient(45%, circle, rgba(60, 60, 60, 0.6) 0%, rgba(151, 151, 151, 0.6) 100%);
            border-radius: 10px;
            border: 1px solid #111;
            box-shadow: 0 2px 5px rgba(20, 20, 20, 0.5);
            content: "";
            display: block;
            height: 10px;
            right: -20px;
            position: absolute;
            top: 15px;
            transition: all 0.2s;
            width: 10px;
            z-index: 12;
            user-select: none;
          }

          .analog-switch-template .switch-label span {
            background: linear-gradient(#4f4f4f, #2b2b2b);
            border-radius: 30px;
            border: 1px solid #1a1a1a;
            box-shadow: 0 0 4px rgba(0, 0, 0, 0.5), 0 1px 1px rgba(255, 255, 255, 0.1) inset, 0 -2px 0 rgba(0, 0, 0, 0.2) inset;
            display: block;
            height: 38px;
            left: 1px;
            position: absolute;
            top: 1px;
            transition: all 0.2s linear;
            width: 53px;
            user-select: none;
          }

          .analog-switch-template .switch-label span:before {
            background: #fff;
            background: linear-gradient(to right, rgba(48, 48, 48, 0.4), rgba(34, 34, 34, 0.4));
            border-radius: 30px 10px 10px 30px;
            box-shadow: -2px 0 5px rgba(0, 0, 0, 0.2) inset;
            content: "";
            display: block;
            height: 33px;
            left: 2px;
            position: absolute;
            top: 2px;
            width: 21px;
            user-select: none;
          }

          .analog-switch-template .switch-label span:after {
            background: #fff;
            background: linear-gradient(to left, rgba(48, 48, 48, 0.4), rgba(34, 34, 34, 0.4));
            border-radius: 10px 30px 30px 10px;
            box-shadow: 2px 0 5px rgba(0, 0, 0, 0.2) inset;
            content: "";
            display: block;
            height: 33px;
            position: absolute;
            right: 2px;
            top: 2px;
            width: 21px;
            user-select: none;
          }

          .analog-switch-template .switch-check:checked + .switch-label span {
            left: 59px;
          }

          .analog-switch-template .switch-check:checked + .switch-label:before {
            background: -webkit-radial-gradient(45%, circle, rgba(60, 60, 60, 0.6) 0%, rgba(151, 151, 151, 0.6) 100%);
            border: 1px solid #111;
            box-shadow: 0 2px 5px rgba(20, 20, 20, 0.5);
            user-select: none;
          }

          .analog-switch-template .switch-check:checked + .switch-label:after {
            background: -webkit-radial-gradient(45%, circle, lightgreen 0%, lightgreen 100%);
            border: 1px solid #004562;
            box-shadow: 0 2px 5px green, 0 0 5px green inset;
            user-select: none;
          }
        ` }} />
        <div className="switch">
          <input
            className="switch-check"
            id={switchId}
            type="checkbox"
            checked={isChecked}
            readOnly
          />
          <label className="switch-label" htmlFor={switchId}>
            Check
            <span />
          </label>
        </div>
      </div>
    </div>
  );
}

export default ToggleSwitchTemplate;
