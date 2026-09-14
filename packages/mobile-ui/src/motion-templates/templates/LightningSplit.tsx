import { useEffect, useMemo, useRef } from 'react';
import type { HtmlTemplateProps } from '../types';
import { placeholderImage } from "../local-placeholder";

export const ELECTRIC_CONFIG = {
  svg: {
    strokes: {
      outer: { width: 3, color: 'rgba(173,216,230,0.75)' },
      mid: { width: 2.2, color: 'rgba(135,206,250,0.55)' },
      core: { width: 1.2, opacity: 0.95, color: 'white' },
    },
    glowBlur: 0.9,
  },
  speeds: [-1.32, 0.42, 0.95],
  shimmer: {
    speed: 4.2,
    freq: 8.5,
    amp: 0.25,
  },
  segments: 48,
  freqs: [0.7, 2.7, 3.9],
  amps: [0.4, -0.8, 0.6],
} as const;

function DeterministicShaderCanvas({ className = '', time }: { className?: string; time: number }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const gl = canvas.getContext('webgl', { premultipliedAlpha: false, alpha: true });
    if (!gl) return;

    const vertexShaderSource = `
      attribute vec2 a_position;
      void main() {
        gl_Position = vec4(a_position, 0.0, 1.0);
      }
    `;

    const fragmentShaderSource = `
      precision highp float;
      
      uniform float iTime;
      uniform vec2 iResolution;
      
      vec3 random3(vec3 c) {
          float j = 4096.0*sin(dot(c,vec3(17.0, 59.4, 15.0)));
          vec3 r;
          r.z = fract(512.0*j);
          j *= .125;
          r.x = fract(512.0*j);
          j *= .125;
          r.y = fract(512.0*j);
          return r-0.5;
      }

      const float F3 =  0.3333333;
      const float G3 =  0.1666667;

      float simplex3d(vec3 p) {
           vec3 s = floor(p + dot(p, vec3(F3)));
           vec3 x = p - s + dot(s, vec3(G3));
           
           vec3 e = step(vec3(0.0), x - x.yzx);
           vec3 i1 = e*(1.0 - e.zxy);
           vec3 i2 = 1.0 - e.zxy*(1.0 - e);
               
           vec3 x1 = x - i1 + G3;
           vec3 x2 = x - i2 + 2.0*G3;
           vec3 x3 = x - 1.0 + 3.0*G3;
           
           vec4 w, d;
           
           w.x = dot(x, x);
           w.y = dot(x1, x1);
           w.z = dot(x2, x2);
           w.w = dot(x3, x3);
           
           w = max(0.6 - w, 0.0);
           
           d.x = dot(random3(s), x);
           d.y = dot(random3(s + i1), x1);
           d.z = dot(random3(s + i2), x2);
           d.w = dot(random3(s + 1.0), x3);
           
           w *= w;
           w *= w;
           d *= w;
           
           return dot(d, vec4(52.0));
      }

      float noise(vec3 m) {
          return   0.5333333*simplex3d(m)
                  +0.2666667*simplex3d(2.0*m)
                  +0.1333333*simplex3d(4.0*m)
                  +0.0666667*simplex3d(8.0*m);
      }

      void main() {
        vec2 fragCoord = gl_FragCoord.xy;
        vec4 fragColor;
        
        vec2 uv = fragCoord.xy / iResolution.xy;    
        uv = uv * 2. -1.;  
       
        vec2 p = fragCoord.xy/iResolution.x;
        vec3 p3 = vec3(p, iTime*0.25);    
          
        float intensity = noise(vec3(p3*12.0+12.0));
                                
        float t = clamp((uv.x * -uv.x * 0.16) + 0.15, 0., 1.);                         
        float y = abs(intensity * -t + uv.y);
          
        float g = pow(y, 0.14);
                                
        vec3 col = vec3(2.0, 2.1, 2.3);
        col = col * -g + col;                    
        col = col * col;
        col = col * col;
                                
        fragColor.rgb = col;                          
        fragColor.w = dot(col, vec3(0.299, 0.587, 0.114));
        
        gl_FragColor = fragColor;
      }
    `;

    function createShader(gl: WebGLRenderingContext, type: number, source: string) {
      const shader = gl.createShader(type);
      if (!shader) return null;

      gl.shaderSource(shader, source);
      gl.compileShader(shader);

      if (gl.getShaderParameter(shader, gl.COMPILE_STATUS) === false) {
        console.error('Error compiling shader:', gl.getShaderInfoLog(shader));
        gl.deleteShader(shader);
        return null;
      }

      return shader;
    }

    function createProgram(gl: WebGLRenderingContext, vertexShader: WebGLShader, fragmentShader: WebGLShader) {
      const program = gl.createProgram();
      if (!program) return null;

      gl.attachShader(program, vertexShader);
      gl.attachShader(program, fragmentShader);
      gl.linkProgram(program);

      if (gl.getProgramParameter(program, gl.LINK_STATUS) === false) {
        console.error('Error linking program:', gl.getProgramInfoLog(program));
        gl.deleteProgram(program);
        return null;
      }

      return program;
    }

    const vertexShader = createShader(gl, gl.VERTEX_SHADER, vertexShaderSource);
    const fragmentShader = createShader(gl, gl.FRAGMENT_SHADER, fragmentShaderSource);

    if (!vertexShader || !fragmentShader) return;

    const program = createProgram(gl, vertexShader, fragmentShader);
    if (!program) return;

    const positionAttributeLocation = gl.getAttribLocation(program, 'a_position');
    const timeUniformLocation = gl.getUniformLocation(program, 'iTime');
    const resolutionUniformLocation = gl.getUniformLocation(program, 'iResolution');

    const positionBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 1, -1, -1, 1, -1, 1, 1, -1, 1, 1]), gl.STATIC_DRAW);

    // Set canvas sizes
    const displayWidth = canvas.clientWidth || 800;
    const displayHeight = canvas.clientHeight || 600;
    if (canvas.width !== displayWidth || canvas.height !== displayHeight) {
      canvas.width = displayWidth;
      canvas.height = displayHeight;
    }

    // Render exactly one single frame
    gl.viewport(0, 0, canvas.width, canvas.height);
    gl.clearColor(0, 0, 0, 0);
    gl.clear(gl.COLOR_BUFFER_BIT);
    gl.enable(gl.BLEND);
    gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);

    gl.useProgram(program);

    gl.enableVertexAttribArray(positionAttributeLocation);
    gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
    gl.vertexAttribPointer(positionAttributeLocation, 2, gl.FLOAT, false, 0, 0);

    // Pass deterministic playhead time (in seconds)
    gl.uniform1f(timeUniformLocation, time);
    gl.uniform2f(resolutionUniformLocation, canvas.width, canvas.height);

    gl.drawArrays(gl.TRIANGLES, 0, 6);

    // Clean up
    return () => {
      gl.deleteBuffer(positionBuffer);
      gl.deleteProgram(program);
      gl.deleteShader(vertexShader);
      gl.deleteShader(fragmentShader);
    };
  }, [time]);

  return (
    <canvas
      ref={canvasRef}
      className={`${className} pointer-events-none bg-transparent`}
      style={{ display: 'block', width: '100%', height: '100%' }}
    />
  );
}

export function LightningSplitTemplate({ progress, time, width, height, values }: HtmlTemplateProps) {
  // Read controls
  const leftImage = String(values.leftImage ?? placeholderImage("09q80w1200"));
  const rightImage = String(values.rightImage ?? placeholderImage("52q80w1200"));
  const leftText = String(values.leftText ?? "SUSTAINABLE");
  const rightText = String(values.rightText ?? "COMMUNITY");
  const clipOffset = Number(values.clipOffset ?? 25);
  const textScale = Math.min(width, height) / 1080;

  // Derive split position from progress: slide from -50% to 150%
  const displayPos = -50 + progress * 200;

  const clamp01_100 = (v: number) => Math.max(0, Math.min(100, v));

  const { polyPointsStr, clipPolygonStr } = useMemo(() => {
    const SEGMENTS = ELECTRIC_CONFIG.segments;
    const AMPS = ELECTRIC_CONFIG.amps;
    const FREQS = ELECTRIC_CONFIG.freqs;
    const SPEEDS = ELECTRIC_CONFIG.speeds;

    const topX = clamp01_100(displayPos);
    const bottomX = clamp01_100(displayPos - clipOffset);

    const pts: Array<{ x: number; y: number }> = [];
    for (let i = 0; i <= SEGMENTS; i++) {
      const tNorm = i / SEGMENTS;
      const y = tNorm * 100;
      const base = topX * (1 - tNorm) + bottomX * tNorm;
      
      let off = 0;
      for (let k = 0; k < AMPS.length; k++) {
        off += AMPS[k] * Math.sin(2 * Math.PI * (FREQS[k] * tNorm + SPEEDS[k] * time) + k * 1.3);
      }
      off += ELECTRIC_CONFIG.shimmer.amp * Math.sin(2 * Math.PI * (ELECTRIC_CONFIG.shimmer.freq * tNorm + ELECTRIC_CONFIG.shimmer.speed * time));

      const x = clamp01_100(base + off);
      pts.push({ y, x });
    }

    const polyPointsStr = pts.map(p => `${p.x},${p.y}`).join(' ');
    const edgePoints = pts.map(p => `${p.x}% ${p.y}%`).join(', ');
    const clipPolygonStr = `polygon(0% 0%, ${edgePoints}, 0% 100%)`;

    return { polyPointsStr, clipPolygonStr };
  }, [displayPos, time, clipOffset]);

  const x1 = displayPos;
  const x2 = clamp01_100(displayPos - clipOffset);

  const realX1 = (x1 / 100) * width;
  const realY1 = 0;
  const realX2 = (x2 / 100) * width;
  const realY2 = height;

  const angle = Math.atan2(realY2 - realY1, realX2 - realX1) * (180 / Math.PI);
  const lineLength = Math.sqrt(Math.pow(realX2 - realX1, 2) + Math.pow(realY2 - realY1, 2));

  const overlayX = realX1;
  const overlayY = realY1;

  const leftClipStyle: React.CSSProperties & { WebkitClipPath?: string } = {
    WebkitClipPath: clipPolygonStr,
    clipPath: clipPolygonStr,
  };

  const fontSize = Math.max(24, Math.round(90 * textScale));

  return (
    <div
      style={{
        position: "absolute",
        inset: 0,
        backgroundColor: "#000",
        overflow: "hidden",
        fontFamily: "Inter, system-ui, sans-serif",
      }}
    >
      {/* Right Content */}
      <div style={{ position: "absolute", inset: 0 }}>
        <img src={rightImage} alt="Right Background" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
        <div style={{ position: "absolute", inset: 0, backgroundColor: "rgba(0,0,0,0.3)" }} />
        <div
          style={{
            position: "absolute",
            right: "10%",
            top: "50%",
            transform: "translateY(-50%)",
            fontSize: `${fontSize}px`,
            fontWeight: 900,
            color: "#ffffff",
            letterSpacing: "-0.04em",
          }}
        >
          {rightText}
        </div>
      </div>

      {/* Left Content (Clipped) */}
      <div style={{ position: "absolute", inset: 0, ...leftClipStyle }}>
        <img src={leftImage} alt="Left Background" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
        <div style={{ position: "absolute", inset: 0, backgroundColor: "rgba(0,0,0,0.3)" }} />
        <div
          style={{
            position: "absolute",
            left: "10%",
            top: "50%",
            transform: "translateY(-50%)",
            fontSize: `${fontSize}px`,
            fontWeight: 900,
            color: "#62B2FE",
            letterSpacing: "-0.04em",
          }}
        >
          {leftText}
        </div>
      </div>

      {/* Electric Arc Divider (SVG) */}
      <svg
        style={{
          position: "absolute",
          inset: 0,
          zIndex: 30,
          pointerEvents: "none",
          width: "100%",
          height: "100%",
        }}
        viewBox="0 0 100 100"
        preserveAspectRatio="none"
      >
        <defs>
          <filter id="electric-glow" x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation={ELECTRIC_CONFIG.svg.glowBlur} result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>

        <polyline
          points={polyPointsStr}
          fill="none"
          stroke={ELECTRIC_CONFIG.svg.strokes.mid.color}
          strokeWidth={ELECTRIC_CONFIG.svg.strokes.mid.width}
          vectorEffect="non-scaling-stroke"
          filter="url(#electric-glow)"
        />
        <polyline
          points={polyPointsStr}
          fill="none"
          stroke={ELECTRIC_CONFIG.svg.strokes.core.color}
          strokeOpacity={ELECTRIC_CONFIG.svg.strokes.core.opacity}
          strokeWidth={ELECTRIC_CONFIG.svg.strokes.core.width}
          vectorEffect="non-scaling-stroke"
        />
        <polyline
          points={polyPointsStr}
          fill="none"
          stroke={ELECTRIC_CONFIG.svg.strokes.outer.color}
          strokeWidth={ELECTRIC_CONFIG.svg.strokes.outer.width}
          vectorEffect="non-scaling-stroke"
          filter="url(#electric-glow)"
        />
      </svg>

      {/* Shader overlay */}
      <div
        style={{
          position: "absolute",
          left: 0,
          top: 0,
          zIndex: 20,
          width: `${lineLength}px`,
          height: `${Math.max(10, Math.round(40 * textScale))}px`,
          transform: `translate(${overlayX}px, ${overlayY}px) rotate(${angle}deg)`,
          transformOrigin: "left center",
        }}
      >
        <div
          style={{
            position: "absolute",
            left: "-50px",
            top: "-100px",
            width: "300px",
            height: "200px",
            opacity: 0.8,
          }}
        >
          <DeterministicShaderCanvas time={time} />
        </div>
      </div>
    </div>
  );
}
export default LightningSplitTemplate;
