import { useEffect, useRef, useCallback } from 'react';

interface Hexagon {
  x: number;
  y: number;
  row: number;
  col: number;
  phase: number;
  pulseSpeed: number;
  baseOpacity: number;
  colorIndex: number;
}

interface RippleWave {
  centerX: number;
  centerY: number;
  radius: number;
  maxRadius: number;
  speed: number;
  intensity: number;
  colorIndex: number;
}

// 赛博朋克配色方案
const CYBER_COLORS = [
  { r: 0, g: 255, b: 255 },    // 青色 Cyan
  { r: 255, g: 0, b: 255 },    // 品红 Magenta
  { r: 138, g: 43, b: 226 },   // 紫罗兰 Violet
  { r: 0, g: 191, b: 255 },    // 深天蓝 DeepSkyBlue
  { r: 255, g: 20, b: 147 },   // 深粉红 DeepPink
];

export default function ParticleBackground() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const hexagonsRef = useRef<Hexagon[]>([]);
  const ripplesRef = useRef<RippleWave[]>([]);
  const animationFrameRef = useRef<number | undefined>(undefined);
  const timeRef = useRef<number>(0);

  // 绘制六边形
  const drawHexagon = useCallback((
    ctx: CanvasRenderingContext2D,
    x: number,
    y: number,
    size: number,
    opacity: number,
    color: { r: number; g: number; b: number },
    glowIntensity: number = 0
  ) => {
    const angle = Math.PI / 3;
    ctx.beginPath();
    for (let i = 0; i < 6; i++) {
      const px = x + size * Math.cos(angle * i - Math.PI / 6);
      const py = y + size * Math.sin(angle * i - Math.PI / 6);
      if (i === 0) {
        ctx.moveTo(px, py);
      } else {
        ctx.lineTo(px, py);
      }
    }
    ctx.closePath();

    // 发光效果
    if (glowIntensity > 0) {
      ctx.shadowBlur = 20 * glowIntensity;
      ctx.shadowColor = `rgba(${color.r}, ${color.g}, ${color.b}, ${opacity * 0.8})`;
    } else {
      ctx.shadowBlur = 0;
    }

    // 填充渐变
    const gradient = ctx.createRadialGradient(x, y, 0, x, y, size);
    gradient.addColorStop(0, `rgba(${color.r}, ${color.g}, ${color.b}, ${opacity * 0.3})`);
    gradient.addColorStop(0.7, `rgba(${color.r}, ${color.g}, ${color.b}, ${opacity * 0.1})`);
    gradient.addColorStop(1, `rgba(${color.r}, ${color.g}, ${color.b}, 0)`);
    ctx.fillStyle = gradient;
    ctx.fill();

    // 边框
    ctx.strokeStyle = `rgba(${color.r}, ${color.g}, ${color.b}, ${opacity * 0.6})`;
    ctx.lineWidth = 1 + glowIntensity;
    ctx.stroke();
    ctx.shadowBlur = 0;
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // 设置画布尺寸
    const resizeCanvas = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
      initHexagons();
    };

    // 初始化六边形蜂巢网格
    const initHexagons = () => {
      hexagonsRef.current = [];
      const hexSize = 40;
      const hexWidth = hexSize * 2;
      const hexHeight = hexSize * Math.sqrt(3);
      const horizontalSpacing = hexWidth * 0.75;
      const verticalSpacing = hexHeight;

      const cols = Math.ceil(canvas.width / horizontalSpacing) + 2;
      const rows = Math.ceil(canvas.height / verticalSpacing) + 2;

      for (let row = -1; row < rows; row++) {
        for (let col = -1; col < cols; col++) {
          const x = col * horizontalSpacing;
          const y = row * verticalSpacing + (col % 2 === 0 ? 0 : verticalSpacing / 2);
          
          hexagonsRef.current.push({
            x,
            y,
            row,
            col,
            phase: Math.random() * Math.PI * 2,
            pulseSpeed: 0.5 + Math.random() * 1.5,
            baseOpacity: 0.05 + Math.random() * 0.05,
            colorIndex: Math.floor(Math.random() * CYBER_COLORS.length),
          });
        }
      }
    };

    // 添加波纹
    const addRipple = (x?: number, y?: number) => {
      const centerX = x ?? Math.random() * canvas.width;
      const centerY = y ?? Math.random() * canvas.height;
      
      ripplesRef.current.push({
        centerX,
        centerY,
        radius: 0,
        maxRadius: Math.max(canvas.width, canvas.height) * 0.8,
        speed: 2 + Math.random() * 3,
        intensity: 0.5 + Math.random() * 0.5,
        colorIndex: Math.floor(Math.random() * CYBER_COLORS.length),
      });

      // 限制波纹数量
      if (ripplesRef.current.length > 5) {
        ripplesRef.current.shift();
      }
    };

    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);

    // 点击添加波纹
    const handleClick = (e: MouseEvent) => {
      addRipple(e.clientX, e.clientY);
    };
    canvas.addEventListener('click', handleClick);

    // 定时自动添加波纹
    const rippleInterval = setInterval(() => {
      if (ripplesRef.current.length < 3) {
        addRipple();
      }
    }, 3000);

    // 初始波纹
    setTimeout(() => addRipple(), 500);

    // 动画循环
    const animate = (currentTime: number) => {
      const deltaTime = (currentTime - timeRef.current) / 1000;
      timeRef.current = currentTime;

      // 清除画布 - 使用半透明黑色实现拖尾效果
      ctx.fillStyle = 'rgba(5, 5, 15, 0.15)';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // 更新和绘制波纹
      ripplesRef.current = ripplesRef.current.filter(ripple => {
        ripple.radius += ripple.speed * deltaTime * 100;
        return ripple.radius < ripple.maxRadius;
      });

      // 绘制六边形
      const time = currentTime * 0.001;
      hexagonsRef.current.forEach(hex => {
        // 计算呼吸灯效果
        const breathe = Math.sin(time * hex.pulseSpeed + hex.phase) * 0.5 + 0.5;
        
        // 计算波纹影响
        let rippleEffect = 0;
        let rippleColorIndex = hex.colorIndex;
        
        ripplesRef.current.forEach(ripple => {
          const dx = hex.x - ripple.centerX;
          const dy = hex.y - ripple.centerY;
          const dist = Math.sqrt(dx * dx + dy * dy);
          const rippleWidth = 150;
          
          if (dist > ripple.radius - rippleWidth && dist < ripple.radius + rippleWidth) {
            const proximity = 1 - Math.abs(dist - ripple.radius) / rippleWidth;
            const waveIntensity = proximity * ripple.intensity * (1 - ripple.radius / ripple.maxRadius);
            if (waveIntensity > rippleEffect) {
              rippleEffect = waveIntensity;
              rippleColorIndex = ripple.colorIndex;
            }
          }
        });

        // 混合颜色
        const baseColor = CYBER_COLORS[hex.colorIndex];
        const rippleColor = CYBER_COLORS[rippleColorIndex];
        const mixRatio = rippleEffect * 0.8;
        const finalColor = {
          r: Math.round(baseColor.r * (1 - mixRatio) + rippleColor.r * mixRatio),
          g: Math.round(baseColor.g * (1 - mixRatio) + rippleColor.g * mixRatio),
          b: Math.round(baseColor.b * (1 - mixRatio) + rippleColor.b * mixRatio),
        };

        // 计算最终透明度
        const opacity = hex.baseOpacity + breathe * 0.15 + rippleEffect * 0.6;
        const glowIntensity = breathe * 0.3 + rippleEffect * 0.7;

        drawHexagon(ctx, hex.x, hex.y, 38, opacity, finalColor, glowIntensity);
      });

      // 绘制扫描线效果
      const scanLineY = (time * 50) % canvas.height;
      const scanGradient = ctx.createLinearGradient(0, scanLineY - 100, 0, scanLineY + 100);
      scanGradient.addColorStop(0, 'rgba(0, 255, 255, 0)');
      scanGradient.addColorStop(0.5, 'rgba(0, 255, 255, 0.03)');
      scanGradient.addColorStop(1, 'rgba(0, 255, 255, 0)');
      ctx.fillStyle = scanGradient;
      ctx.fillRect(0, scanLineY - 100, canvas.width, 200);

      // 添加噪点效果
      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      const data = imageData.data;
      for (let i = 0; i < data.length; i += 4 * 10) {
        const noise = (Math.random() - 0.5) * 10;
        data[i] = Math.min(255, Math.max(0, data[i] + noise));
        data[i + 1] = Math.min(255, Math.max(0, data[i + 1] + noise));
        data[i + 2] = Math.min(255, Math.max(0, data[i + 2] + noise));
      }
      ctx.putImageData(imageData, 0, 0);

      animationFrameRef.current = requestAnimationFrame(animate);
    };

    animationFrameRef.current = requestAnimationFrame(animate);

    return () => {
      window.removeEventListener('resize', resizeCanvas);
      canvas.removeEventListener('click', handleClick);
      clearInterval(rippleInterval);
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [drawHexagon]);

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 w-full h-full cursor-pointer"
      style={{ 
        background: 'linear-gradient(135deg, #050510 0%, #0a0a20 50%, #100520 100%)'
      }}
    />
  );
}
