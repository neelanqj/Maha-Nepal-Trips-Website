import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { Play, Compass, Mountain, ShieldCheck, MapPin, ArrowRight } from 'lucide-react';
import { VideoModal } from './VideoModal.tsx';
import type { HeroContent } from '../types/index.ts';

interface GlobeHeroProps {
  content?: HeroContent | null;
  onExploreClick?: () => void;
}

export const GlobeHero: React.FC<GlobeHeroProps> = ({ content, onExploreClick }) => {
  const mountRef = useRef<HTMLDivElement>(null);
  const [isVideoOpen, setIsVideoOpen] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const [isFocused, setIsFocused] = useState(false);
  const [webglSupported, setWebglSupported] = useState(true);
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);

  // Content defaults
  const headline = content?.headline || 'Authentic Himalayan Journeys Led by Veteran Guide Deepak Kushwaha';
  const subtitle = content?.subtitle || 'Experience Nepal through the eyes of a certified local mountain guide. Direct booking, personalized safety, zero middleman markups, and unforgettable Himalayan memories.';
  const guideName = content?.guide_name || 'Deepak Kushwaha';
  const guideTitle = content?.guide_title || 'Certified Senior Trekking Guide';
  const videoUrl = content?.intro_video_url || 'https://www.youtube.com/embed/9B1UEm2Z5f0';
  const videoPoster = content?.intro_video_poster || '/uploads/deepak_portrait_1792111591328.jpg';
  const fallbackBg = content?.scenic_background || '/uploads/everest_trail_1792111603554.jpg';
  const globeEnabled = content?.globe_enabled !== false;

  const isFocusedOnNepal = isHovered || isFocused;

  useEffect(() => {
    // Check reduced motion
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    setPrefersReducedMotion(mediaQuery.matches);
    const handler = (e: MediaQueryListEvent) => setPrefersReducedMotion(e.matches);
    mediaQuery.addEventListener('change', handler);
    return () => mediaQuery.removeEventListener('change', handler);
  }, []);

  useEffect(() => {
    if (!globeEnabled || prefersReducedMotion || !mountRef.current) {
      return;
    }

    const container = mountRef.current;
    let width = container.clientWidth;
    let height = container.clientHeight;

    // Check WebGL
    let renderer: THREE.WebGLRenderer;
    try {
      renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, powerPreference: 'high-performance' });
    } catch {
      setWebglSupported(false);
      return;
    }

    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.15;
    container.innerHTML = '';
    container.appendChild(renderer.domElement);

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 1000);
    camera.position.set(0, 0.5, 6.2);

    // 1. Studio Lighting Rig
    const ambientLight = new THREE.AmbientLight(0x0f1d33, 1.8);
    scene.add(ambientLight);

    const hemiLight = new THREE.HemisphereLight(0x38bdf8, 0x020617, 1.2);
    scene.add(hemiLight);

    const sunLight = new THREE.DirectionalLight(0xfff7ed, 3.2);
    sunLight.position.set(5, 3, 5);
    scene.add(sunLight);

    const rimLight = new THREE.DirectionalLight(0xdc2626, 1.6); // Nepal Red rim light
    rimLight.position.set(-6, -2, -4);
    scene.add(rimLight);

    // 2. Procedural World Texture Generation
    const canvas = document.createElement('canvas');
    canvas.width = 2048;
    canvas.height = 1024;
    const ctx = canvas.getContext('2d')!;

    // Deep Navy Ocean
    const oceanGrad = ctx.createLinearGradient(0, 0, 0, 1024);
    oceanGrad.addColorStop(0, '#061325');
    oceanGrad.addColorStop(0.5, '#0b1d3a');
    oceanGrad.addColorStop(1, '#061325');
    ctx.fillStyle = oceanGrad;
    ctx.fillRect(0, 0, 2048, 1024);

    // Subtle lat/long grid lines
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.04)';
    ctx.lineWidth = 1;
    for (let x = 0; x < 2048; x += 128) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, 1024);
      ctx.stroke();
    }
    for (let y = 0; y < 1024; y += 128) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(2048, y);
      ctx.stroke();
    }

    // Procedural Continents (Asia, Europe, Africa, Americas)
    ctx.fillStyle = '#1c3127'; // Rich mountain green/slate
    // Eurasia / Asia
    ctx.beginPath();
    ctx.ellipse(1450, 360, 320, 180, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.ellipse(1350, 420, 240, 140, 0.3, 0, Math.PI * 2);
    ctx.fill();
    // Indian Subcontinent & Himalayas
    ctx.fillStyle = '#263d30';
    ctx.beginPath();
    ctx.moveTo(1360, 420);
    ctx.lineTo(1420, 560);
    ctx.lineTo(1320, 520);
    ctx.closePath();
    ctx.fill();
    // Himalayan snow ridge
    ctx.fillStyle = '#f8fafc';
    ctx.fillRect(1355, 430, 75, 8);
    // Africa
    ctx.fillStyle = '#1e3328';
    ctx.beginPath();
    ctx.ellipse(1120, 540, 180, 220, 0.2, 0, Math.PI * 2);
    ctx.fill();
    // Europe
    ctx.beginPath();
    ctx.ellipse(1080, 320, 120, 90, 0, 0, Math.PI * 2);
    ctx.fill();
    // Americas
    ctx.beginPath();
    ctx.ellipse(480, 360, 160, 200, 0.1, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.ellipse(580, 680, 140, 220, 0.4, 0, Math.PI * 2);
    ctx.fill();
    // Australia
    ctx.beginPath();
    ctx.ellipse(1680, 720, 120, 90, 0, 0, Math.PI * 2);
    ctx.fill();

    const earthTexture = new THREE.CanvasTexture(canvas);
    earthTexture.colorSpace = THREE.SRGBColorSpace;
    earthTexture.anisotropy = renderer.capabilities.getMaxAnisotropy();

    // 3. Earth Globe Mesh
    const globeRadius = 2.2;
    const globeGeo = new THREE.SphereGeometry(globeRadius, 64, 64);
    const globeMat = new THREE.MeshStandardMaterial({
      map: earthTexture,
      roughness: 0.65,
      metalness: 0.15,
      bumpScale: 0.05
    });
    const globe = new THREE.Mesh(globeGeo, globeMat);
    // Axial tilt of Earth (~23.4 degrees)
    globe.rotation.z = (23.4 * Math.PI) / 180;
    scene.add(globe);

    // 4. Cloud Sphere
    const cloudCanvas = document.createElement('canvas');
    cloudCanvas.width = 1024;
    cloudCanvas.height = 512;
    const cloudCtx = cloudCanvas.getContext('2d')!;
    cloudCtx.fillStyle = 'rgba(0,0,0,0)';
    cloudCtx.fillRect(0, 0, 1024, 512);
    cloudCtx.fillStyle = 'rgba(255, 255, 255, 0.28)';
    for (let i = 0; i < 50; i++) {
      const cx = Math.random() * 1024;
      const cy = 100 + Math.random() * 312;
      const r = 20 + Math.random() * 45;
      cloudCtx.beginPath();
      cloudCtx.arc(cx, cy, r, 0, Math.PI * 2);
      cloudCtx.fill();
    }
    const cloudTexture = new THREE.CanvasTexture(cloudCanvas);
    const cloudGeo = new THREE.SphereGeometry(globeRadius + 0.035, 48, 48);
    const cloudMat = new THREE.MeshStandardMaterial({
      map: cloudTexture,
      transparent: true,
      opacity: 0.4,
      blending: THREE.AdditiveBlending,
      depthWrite: false
    });
    const clouds = new THREE.Mesh(cloudGeo, cloudMat);
    globe.add(clouds);

    // 5. Atmosphere Outer Glow
    const atmosphereGeo = new THREE.SphereGeometry(globeRadius + 0.16, 48, 48);
    const atmosphereMat = new THREE.ShaderMaterial({
      vertexShader: `
        varying vec3 vNormal;
        void main() {
          vNormal = normalize(normalMatrix * normal);
          gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
      `,
      fragmentShader: `
        varying vec3 vNormal;
        void main() {
          float intensity = pow(0.68 - dot(vNormal, vec3(0, 0, 1.0)), 2.0);
          gl_FragColor = vec4(0.2, 0.5, 0.9, 1.0) * intensity * 1.5;
        }
      `,
      blending: THREE.AdditiveBlending,
      side: THREE.BackSide,
      transparent: true
    });
    const atmosphere = new THREE.Mesh(atmosphereGeo, atmosphereMat);
    scene.add(atmosphere);

    // 6. Nepal Marker Coordinates: lat 28.39, lon 84.12
    const lat = 28.39;
    const lon = 84.12;
    const phi = (90 - lat) * (Math.PI / 180);
    const theta = (lon + 180) * (Math.PI / 180);
    const nepalX = -(globeRadius * Math.sin(phi) * Math.cos(theta));
    const nepalY = globeRadius * Math.cos(phi);
    const nepalZ = globeRadius * Math.sin(phi) * Math.sin(theta);

    // Nepal Group attached to globe
    const nepalGroup = new THREE.Group();
    nepalGroup.position.set(nepalX, nepalY, nepalZ);

    // Golden Pyramid Beacon
    const pinGeo = new THREE.ConeGeometry(0.08, 0.22, 6);
    pinGeo.rotateX(Math.PI / 2);
    const pinMat = new THREE.MeshStandardMaterial({
      color: 0xfbbf24,
      metalness: 0.9,
      roughness: 0.2,
      emissive: 0xd97706,
      emissiveIntensity: 0.6
    });
    const pinMesh = new THREE.Mesh(pinGeo, pinMat);
    nepalGroup.add(pinMesh);

    // Glowing Red Ring Pulsing (Logo Red #dc2626)
    const ringGeo = new THREE.RingGeometry(0.12, 0.17, 32);
    const ringMat = new THREE.MeshBasicMaterial({
      color: 0xdc2626,
      side: THREE.DoubleSide,
      transparent: true,
      opacity: 0.85
    });
    const ringMesh = new THREE.Mesh(ringGeo, ringMat);
    nepalGroup.add(ringMesh);

    // Second pulsing beacon ring
    const ringGeo2 = new THREE.RingGeometry(0.22, 0.26, 32);
    const ringMat2 = new THREE.MeshBasicMaterial({
      color: 0xef4444,
      side: THREE.DoubleSide,
      transparent: true,
      opacity: 0.4
    });
    const ringMesh2 = new THREE.Mesh(ringGeo2, ringMat2);
    nepalGroup.add(ringMesh2);

    // Orient marker outward along normal
    const normal = new THREE.Vector3(nepalX, nepalY, nepalZ).normalize();
    nepalGroup.quaternion.setFromUnitVectors(new THREE.Vector3(0, 0, 1), normal);
    globe.add(nepalGroup);

    // 7. Journey Flight/Trek Arc (Delicate red spline from international hub to Kathmandu)
    const p1 = new THREE.Vector3(nepalX, nepalY, nepalZ);
    // Hub coordinate roughly Dubai / Bangkok
    const hubLat = 25.2;
    const hubLon = 55.3;
    const hPhi = (90 - hubLat) * (Math.PI / 180);
    const hTheta = (hubLon + 180) * (Math.PI / 180);
    const p0 = new THREE.Vector3(
      -(globeRadius * Math.sin(hPhi) * Math.cos(hTheta)),
      globeRadius * Math.cos(hPhi),
      globeRadius * Math.sin(hPhi) * Math.sin(hTheta)
    );
    // Midpoint elevated for arched trajectory
    const midPoint = new THREE.Vector3().addVectors(p0, p1).multiplyScalar(0.5);
    midPoint.normalize().multiplyScalar(globeRadius + 0.35);

    const curve = new THREE.QuadraticBezierCurve3(p0, midPoint, p1);
    const arcPoints = curve.getPoints(40);
    const arcGeo = new THREE.BufferGeometry().setFromPoints(arcPoints);
    const arcMat = new THREE.LineBasicMaterial({
      color: 0xdc2626,
      transparent: true,
      opacity: 0.75,
      linewidth: 2
    });
    const arcLine = new THREE.Line(arcGeo, arcMat);
    globe.add(arcLine);

    // Star Dust Particles in deep space
    const starCount = 350;
    const starGeo = new THREE.BufferGeometry();
    const starPos = new Float32Array(starCount * 3);
    for (let i = 0; i < starCount * 3; i += 3) {
      starPos[i] = (Math.random() - 0.5) * 40;
      starPos[i + 1] = (Math.random() - 0.5) * 40;
      starPos[i + 2] = -5 - Math.random() * 25;
    }
    starGeo.setAttribute('position', new THREE.BufferAttribute(starPos, 3));
    const starMat = new THREE.PointsMaterial({ color: 0x94a3b8, size: 0.04, transparent: true, opacity: 0.6 });
    const stars = new THREE.Points(starGeo, starMat);
    scene.add(stars);

    // Initial globe rotation angle to reveal Asia/Nepal
    globe.rotation.y = -1.2;

    // Animation & State Loop
    let animationFrameId: number;
    let isVisible = true;
    let clock = new THREE.Clock();

    // Intersection Observer to pause rendering when off-screen
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          isVisible = entry.isIntersecting;
        });
      },
      { threshold: 0.05 }
    );
    observer.observe(container);

    // Touch / Drag rotation support for mobile & tablet
    let isDragging = false;
    let prevMouseX = 0;
    let prevMouseY = 0;

    const handlePointerDown = (e: PointerEvent) => {
      isDragging = true;
      prevMouseX = e.clientX;
      prevMouseY = e.clientY;
    };

    const handlePointerMove = (e: PointerEvent) => {
      if (!isDragging) return;
      const deltaX = e.clientX - prevMouseX;
      const deltaY = e.clientY - prevMouseY;
      prevMouseX = e.clientX;
      prevMouseY = e.clientY;
      globe.rotation.y += deltaX * 0.005;
      globe.rotation.x = Math.max(-0.5, Math.min(0.5, globe.rotation.x + deltaY * 0.003));
    };

    const handlePointerUp = () => {
      isDragging = false;
    };

    container.addEventListener('pointerdown', handlePointerDown);
    window.addEventListener('pointermove', handlePointerMove);
    window.addEventListener('pointerup', handlePointerUp);

    // Target angles for hover focus
    // Angle to bring Nepal to facing camera:
    const targetNepalRotationY = -2.35;
    const targetNepalRotationX = 0.28;

    const animate = () => {
      animationFrameId = requestAnimationFrame(animate);

      // Don't render if tab is hidden, off-screen, or video modal is active
      if (!isVisible || document.hidden || isVideoOpen) {
        return;
      }

      const delta = Math.min(clock.getDelta(), 0.1);
      const time = clock.getElapsedTime();

      // Clouds slowly orbit independently
      clouds.rotation.y += 0.0004;

      // Pulse beacon rings
      const pulseScale = 1 + Math.sin(time * 3.5) * 0.18;
      ringMesh.scale.set(pulseScale, pulseScale, 1);
      const pulseScale2 = 1 + Math.sin(time * 3.5 + 1.2) * 0.22;
      ringMesh2.scale.set(pulseScale2, pulseScale2, 1);

      // Camera & Globe Smooth Damping
      if (isFocusedOnNepal) {
        // Smoothly rotate globe to face Nepal and move camera closer
        globe.rotation.y = THREE.MathUtils.damp(globe.rotation.y, targetNepalRotationY, 3.2, delta);
        globe.rotation.x = THREE.MathUtils.damp(globe.rotation.x, targetNepalRotationX, 3.2, delta);
        camera.position.z = THREE.MathUtils.damp(camera.position.z, 4.8, 2.8, delta);
        camera.position.y = THREE.MathUtils.damp(camera.position.y, 0.2, 2.8, delta);
      } else {
        // Default gentle ambient drift
        if (!isDragging) {
          globe.rotation.y += 0.0012;
        }
        camera.position.z = THREE.MathUtils.damp(camera.position.z, 6.2, 2.5, delta);
        camera.position.y = THREE.MathUtils.damp(camera.position.y, 0.5, 2.5, delta);
        camera.position.x = THREE.MathUtils.damp(camera.position.x, 0, 2.5, delta);
      }

      renderer.render(scene, camera);
    };

    animate();

    const handleResize = () => {
      if (!container) return;
      width = container.clientWidth;
      height = container.clientHeight;
      camera.aspect = width / height;
      camera.updateProjectionMatrix();
      renderer.setSize(width, height);
    };
    window.addEventListener('resize', handleResize);

    return () => {
      observer.disconnect();
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener('resize', handleResize);
      container.removeEventListener('pointerdown', handlePointerDown);
      window.removeEventListener('pointermove', handlePointerMove);
      window.removeEventListener('pointerup', handlePointerUp);
      renderer.dispose();
      globeGeo.dispose();
      globeMat.dispose();
      cloudGeo.dispose();
      cloudMat.dispose();
      pinGeo.dispose();
      pinMat.dispose();
      ringGeo.dispose();
      ringMat.dispose();
      earthTexture.dispose();
      cloudTexture.dispose();
    };
  }, [globeEnabled, prefersReducedMotion, isHovered, isFocused, isVideoOpen]);

  return (
    <section
      className="relative min-h-[90vh] md:min-h-[94vh] flex items-center bg-[#071326] text-white overflow-hidden select-none"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onFocus={() => setIsFocused(true)}
      onBlur={() => setIsFocused(false)}
      tabIndex={0}
      aria-label="Interactive 3D Himalayan Globe and Hero Showcase"
    >
      {/* 3D WebGL Canvas Layer */}
      {globeEnabled && !prefersReducedMotion && webglSupported ? (
        <div
          ref={mountRef}
          className="absolute inset-0 z-0 pointer-events-auto cursor-grab active:cursor-grabbing"
          title="Drag to inspect Earth and Nepal Himalayas"
        />
      ) : (
        /* Static scenic fallback for reduced-motion / non-WebGL / mobile low-power */
        <div className="absolute inset-0 z-0">
          <img
            src={fallbackBg}
            alt="Everest and Annapurna Himalayas trekking trail"
            className="w-full h-full object-cover opacity-35"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-[#071326] via-[#071326]/70 to-[#071326]/40" />
        </div>
      )}

      {/* Atmospheric Vignette & Deep Navy Gradients */}
      <div className="absolute inset-0 pointer-events-none bg-gradient-to-r from-[#071326] via-[#071326]/75 to-transparent z-10" />
      <div className="absolute inset-x-0 bottom-0 h-40 pointer-events-none bg-gradient-to-t from-[#071326] to-transparent z-10" />

      {/* Hero Content Overlay */}
      <div className="relative z-20 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 sm:py-24 w-full flex flex-col justify-center">
        <div className="max-w-2xl">
          {/* Guide Credential Badge */}
          <div className="inline-flex items-center gap-2.5 px-3.5 py-1.5 rounded-full bg-slate-900/80 border border-red-500/30 text-xs sm:text-sm font-semibold tracking-wide text-slate-200 mb-6 backdrop-blur-md shadow-lg shadow-black/40">
            <span className="w-2 h-2 rounded-full bg-red-600" />
            <span className="text-white font-bold">{guideName}</span>
            <span className="text-slate-400">•</span>
            <span className="text-red-400">{guideTitle}</span>
            <ShieldCheck className="w-4 h-4 text-emerald-400 ml-1" />
          </div>

          {/* Headline */}
          <h1 className="text-3xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight text-white leading-[1.15] mb-6 drop-shadow-md">
            {headline}
          </h1>

          {/* Subtitle */}
          <p className="text-base sm:text-lg text-slate-300 leading-relaxed mb-8 max-w-xl font-normal drop-shadow">
            {subtitle}
          </p>

          {/* Interactive Nepal Focus Tooltip Badge */}
          <div
            className={`transition-all duration-500 mb-8 p-3 sm:p-4 rounded-xl border backdrop-blur-md max-w-lg ${
              isFocusedOnNepal
                ? 'bg-red-950/40 border-red-500/50 shadow-lg shadow-red-950/30 translate-y-0 opacity-100'
                : 'bg-slate-900/60 border-slate-700/40 opacity-90'
            }`}
          >
            <div className="flex items-start gap-3">
              <div className="p-2 rounded-lg bg-red-600/20 text-red-400 border border-red-500/30 shrink-0 mt-0.5">
                <MapPin className="w-5 h-5 text-red-500" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h4 className="text-sm font-bold text-white tracking-wide">
                    Focus: Nepal & The High Himalayas
                  </h4>
                  {isFocusedOnNepal && (
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-red-500/20 text-red-300 font-semibold uppercase tracking-wider">
                      Active Guide Zone
                    </span>
                  )}
                </div>
                <p className="text-xs text-slate-300 mt-1 leading-relaxed">
                  {isFocusedOnNepal
                    ? 'Camera focused on Kathmandu, Annapurna, and Everest ranges. Directly led by Deepak Kushwaha with certified altitude safety.'
                    : 'Hover or focus on the globe to explore Deepak’s Himalayan routes: Everest Base Camp, Annapurna Circuit, Langtang & Mustang.'}
                </p>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-wrap items-center gap-4">
            <a
              href="#tours-section"
              onClick={(e) => {
                e.preventDefault();
                if (onExploreClick) {
                  onExploreClick();
                } else {
                  document.getElementById('tours-section')?.scrollIntoView({ behavior: 'smooth' });
                }
              }}
              className="inline-flex items-center justify-center gap-2.5 px-7 py-3.5 rounded-xl bg-red-600 hover:bg-red-700 active:bg-red-800 text-white font-bold text-base transition-all duration-200 shadow-xl shadow-red-900/40 hover:shadow-red-900/60 hover:-translate-y-0.5 focus:outline-none focus:ring-4 focus:ring-red-500/50"
            >
              <Compass className="w-5 h-5" />
              <span>{content?.explore_button_label || 'Explore Trips'}</span>
              <ArrowRight className="w-4 h-4 ml-0.5" />
            </a>

            <button
              type="button"
              onClick={() => setIsVideoOpen(true)}
              className="inline-flex items-center justify-center gap-2.5 px-6 py-3.5 rounded-xl bg-slate-900/80 hover:bg-slate-800/90 text-white font-semibold text-base border border-slate-700/80 transition-all duration-200 backdrop-blur-md hover:border-slate-500 hover:-translate-y-0.5 shadow-lg focus:outline-none focus:ring-4 focus:ring-slate-600"
            >
              <div className="w-7 h-7 rounded-full bg-red-600 flex items-center justify-center text-white shadow-md">
                <Play className="w-3.5 h-3.5 fill-current ml-0.5" />
              </div>
              <span>{content?.story_button_label || 'Watch My Story'}</span>
            </button>
          </div>

          {/* Key Trust Badges */}
          <div className="grid grid-cols-3 gap-3 sm:gap-6 mt-12 pt-8 border-t border-slate-800/80 text-left">
            <div>
              <div className="text-xl sm:text-2xl font-extrabold text-white">16+ Yrs</div>
              <div className="text-xs text-slate-400 mt-0.5">Himalayan Guide Experience</div>
            </div>
            <div>
              <div className="text-xl sm:text-2xl font-extrabold text-red-500">100%</div>
              <div className="text-xs text-slate-400 mt-0.5">Direct Local Booking</div>
            </div>
            <div>
              <div className="text-xl sm:text-2xl font-extrabold text-white">140+</div>
              <div className="text-xs text-slate-400 mt-0.5">Summits & High Passes Led</div>
            </div>
          </div>
        </div>
      </div>

      {/* Video Modal Player */}
      <VideoModal
        isOpen={isVideoOpen}
        onClose={() => setIsVideoOpen(false)}
        videoUrl={videoUrl}
        posterImage={videoPoster}
        title="Deepak Kushwaha: Guide to Nepal & The Himalayas"
      />
    </section>
  );
};
