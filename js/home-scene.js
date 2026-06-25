import React, { Suspense, useEffect, useMemo, useRef, useState } from 'https://esm.sh/react@18.2.0';
import { createRoot } from 'https://esm.sh/react-dom@18.2.0/client';
import * as THREE from 'https://esm.sh/three@0.150.1';
import { Canvas, useFrame } from 'https://esm.sh/@react-three/fiber@8.15.16?bundle&deps=react@18.2.0,react-dom@18.2.0,three@0.150.1';

const navigationItems = [
  { title: 'About', tag: 'Who I am', href: '#about', color: '#f26d5b', position: [-2.85, 1.05, -0.45], compactPosition: [-0.58, 1.5, -0.2], rotation: [0.05, 0.35, -0.09], compactRotation: [0.05, 0.16, -0.05], size: 1, compactSize: 0.62 },
  { title: 'Projects', tag: 'Things I build', href: '#projects', color: '#36c5f0', position: [1.55, 1.05, 0.15], compactPosition: [0.58, 0.98, 0], rotation: [0.14, -0.32, 0.06], compactRotation: [0.08, -0.18, 0.04], size: 1, compactSize: 0.62 },
  { title: 'Blog', tag: 'Notes and ideas', href: '#blog', color: '#f4b942', position: [-1.65, -1.18, 0.3], compactPosition: [-0.58, -0.18, 0.1], rotation: [-0.1, -0.42, 0.08], compactRotation: [-0.06, -0.16, 0.05], size: 1, compactSize: 0.62 },
  { title: 'Contact', tag: 'Say hello', href: '#contact', color: '#8bd450', position: [2.35, -1.05, -0.5], compactPosition: [0.58, -0.76, -0.1], rotation: [-0.08, 0.36, -0.04], compactRotation: [-0.05, 0.18, -0.04], size: 1, compactSize: 0.62 },
  { title: 'GitHub', tag: 'Code', href: 'https://github.com/Cobse/', color: '#24292f', textColor: '#fffaf2', tagColor: '#9be7ff', position: [0.02, 1.92, 0.8], compactPosition: [-0.28, -1.42, 0.35], rotation: [0.2, -0.21, 0.08], compactRotation: [0.14, -0.16, 0.05], size: 0.58, compactSize: 0.42, external: true },
  { title: 'LinkedIn', tag: 'Connect', href: 'https://www.linkedin.com/in/fredrikjacobsen', color: '#5aa7ff', position: [0.18, -1.92, 0.95], compactPosition: [0.32, -1.82, 0.42], rotation: [-0.24, 0.28, -0.11], compactRotation: [-0.14, 0.18, -0.06], size: 0.58, compactSize: 0.42, external: true },
];

const compactLayoutQuery = '(max-width: 1100px)';

function goToRoute(href) {
  if (href.startsWith('#')) {
    window.location.hash = href;
    return;
  }

  window.location.assign(href);
}

function syncRoutePanels() {
  const activeRoute = window.location.hash.replace('#', '');
  const panels = document.querySelectorAll('[data-route-panel]');
  const hero = document.querySelector('.home-hero');
  const hasPanelRoute = Array.from(panels).some((panel) => panel.dataset.routePanel === activeRoute);

  document.body.classList.toggle('route-open', hasPanelRoute);

  panels.forEach((panel) => {
    const isActive = panel.dataset.routePanel === activeRoute;
    panel.hidden = !isActive;
    panel.setAttribute('aria-hidden', String(!isActive));
  });

  if (hero) {
    hero.setAttribute('aria-hidden', String(hasPanelRoute));
  }

  if (hasPanelRoute) {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }
}

function closeRoutePanel() {
  history.pushState('', document.title, window.location.pathname + window.location.search);
  syncRoutePanels();
}

function createLabelTexture(item) {
  const canvas = document.createElement('canvas');
  const compact = item.size < 0.8;
  canvas.width = compact ? 512 : 768;
  canvas.height = compact ? 512 : 464;
  const context = canvas.getContext('2d');
  const accent = item.color;

  context.clearRect(0, 0, canvas.width, canvas.height);
  context.fillStyle = accent;
  context.globalAlpha = 0.92;
  roundedRect(context, 0, 0, canvas.width, canvas.height, compact ? 52 : 56);
  context.fill();

  context.globalAlpha = 0.18;
  context.fillStyle = '#ffffff';
  context.beginPath();
  context.arc(118, 106, 56, 0, Math.PI * 2);
  context.fill();
  context.beginPath();
  context.arc(645, 372, 130, 0, Math.PI * 2);
  context.fill();

  context.globalAlpha = 1;
  context.fillStyle = item.textColor || '#fffaf2';
  context.font = compact ? '700 60px Georgia, serif' : '700 82px Georgia, serif';
  context.textAlign = 'center';
  context.textBaseline = 'middle';
  context.fillText(item.title, canvas.width / 2, compact ? 232 : 206);

  context.fillStyle = item.tagColor || '#181818';
  context.font = compact ? '500 28px Arial, sans-serif' : '500 29px Arial, sans-serif';
  context.fillText(item.tag, canvas.width / 2, compact ? 304 : 284);

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.anisotropy = 8;
  return texture;
}

function roundedRect(context, x, y, width, height, radius) {
  context.beginPath();
  context.moveTo(x + radius, y);
  context.arcTo(x + width, y, x + width, y + height, radius);
  context.arcTo(x + width, y + height, x, y + height, radius);
  context.arcTo(x, y + height, x, y, radius);
  context.arcTo(x, y, x + width, y, radius);
  context.closePath();
}

function NavigationTile({ item, index }) {
  const group = useRef();
  const [hovered, setHovered] = useState(false);
  const labelTexture = useMemo(() => createLabelTexture(item), [item]);

  useFrame(({ clock, pointer }) => {
    if (!group.current) return;
    const time = clock.getElapsedTime();
    group.current.position.y = item.position[1] + Math.sin(time * 0.7 + index) * 0.16;
    group.current.rotation.x = item.rotation[0] + Math.sin(time * 0.6 + index) * 0.035 - pointer.y * 0.06;
    group.current.rotation.y = item.rotation[1] + Math.cos(time * 0.55 + index) * 0.045 + pointer.x * 0.08;
    group.current.rotation.z = item.rotation[2] + Math.sin(time * 0.45 + index) * 0.02;
    group.current.scale.setScalar(THREE.MathUtils.lerp(group.current.scale.x, hovered ? item.size * 1.08 : item.size, 0.12));
  });

  return (
    React.createElement('group', {
      ref: group,
      position: item.position,
      onPointerOver: (event) => {
        event.stopPropagation();
        setHovered(true);
        document.body.classList.add('project-can-click');
      },
      onPointerOut: () => {
        setHovered(false);
        document.body.classList.remove('project-can-click');
      },
      onClick: (event) => {
        event.stopPropagation();
        goToRoute(item.href);
      },
    },
      React.createElement('mesh', { position: [0, 0, -0.05] },
        React.createElement('boxGeometry', { args: item.size < 0.8 ? [1.18, 1.18, 0.22, 6, 6, 1] : [2.05, 1.28, 0.18, 6, 6, 1] }),
        React.createElement('meshPhysicalMaterial', {
          color: item.color,
          roughness: 0.32,
          metalness: 0.12,
          clearcoat: 0.75,
          clearcoatRoughness: 0.18,
          transparent: true,
          opacity: hovered ? 0.86 : 0.72,
        })
      ),
      React.createElement('mesh', { position: [0, 0, 0.065] },
        React.createElement('planeGeometry', { args: item.size < 0.8 ? [1.08, 1.08] : [1.92, 1.16] }),
        React.createElement('meshBasicMaterial', { map: labelTexture, transparent: true })
      )
    )
  );
}

function HomeScene() {
  const [isCompact, setIsCompact] = useState(() => window.matchMedia(compactLayoutQuery).matches);

  useEffect(() => {
    syncRoutePanels();

    const closeButtons = document.querySelectorAll('[data-route-close]');
    closeButtons.forEach((button) => button.addEventListener('click', closeRoutePanel));
    window.addEventListener('hashchange', syncRoutePanels);

    return () => {
      closeButtons.forEach((button) => button.removeEventListener('click', closeRoutePanel));
      window.removeEventListener('hashchange', syncRoutePanels);
    };
  }, []);

  useEffect(() => {
    const mediaQuery = window.matchMedia(compactLayoutQuery);
    const updateLayout = () => setIsCompact(mediaQuery.matches);

    updateLayout();
    mediaQuery.addEventListener('change', updateLayout);

    return () => mediaQuery.removeEventListener('change', updateLayout);
  }, []);

  const sceneItems = useMemo(() => navigationItems.map((item) => ({
    ...item,
    position: isCompact ? item.compactPosition : item.position,
    rotation: isCompact ? item.compactRotation : item.rotation,
    size: isCompact ? item.compactSize : item.size,
  })), [isCompact]);

  return (
    React.createElement(React.Fragment, null,
      React.createElement(Canvas, {
        camera: { position: [0, 0.15, 7.2], fov: 44 },
        dpr: [1, 1.75],
        gl: { antialias: true, alpha: true },
      },
        React.createElement('ambientLight', { intensity: 1.1 }),
        React.createElement('directionalLight', { position: [4, 5, 7], intensity: 2.4 }),
        React.createElement('pointLight', { position: [-3, -2, 3], intensity: 1.4, color: '#f26d5b' }),
        React.createElement('pointLight', { position: [3, 2, 2], intensity: 1.2, color: '#36c5f0' }),
        React.createElement(Suspense, { fallback: null },
          sceneItems.map((item, index) => React.createElement(NavigationTile, { key: item.title, item, index }))
        )
      ),
      React.createElement('nav', { className: 'project-link-fallback', 'aria-label': 'Site quick links' },
        navigationItems.map((item) => React.createElement('a', { key: item.title, href: item.href }, item.title))
      )
    )
  );
}

const mount = document.getElementById('project-space');

if (mount) {
  const root = createRoot(mount);
  root.render(React.createElement(HomeScene));
}
