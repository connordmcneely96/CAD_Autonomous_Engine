'use client';

import { useRef } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, Grid, PerspectiveCamera, Environment, Stats } from '@react-three/drei';
import * as THREE from 'three';

// Sample CAD object - a simple bracket
function SampleGeometry() {
  return (
    <group>
      {/* Main body */}
      <mesh castShadow receiveShadow position={[0, 2.5, 0]}>
        <boxGeometry args={[8, 5, 2]} />
        <meshStandardMaterial color="#6366f1" metalness={0.3} roughness={0.4} />
      </mesh>

      {/* Side support */}
      <mesh castShadow receiveShadow position={[0, 2.5, 3]}>
        <boxGeometry args={[8, 5, 2]} />
        <meshStandardMaterial color="#6366f1" metalness={0.3} roughness={0.4} />
      </mesh>

      {/* Connecting piece */}
      <mesh castShadow receiveShadow position={[0, 2.5, 1]}>
        <boxGeometry args={[8, 5, 2]} />
        <meshStandardMaterial color="#6366f1" metalness={0.3} roughness={0.4} />
      </mesh>

      {/* Mounting holes */}
      <mesh castShadow position={[-3, 2.5, 3.2]}>
        <cylinderGeometry args={[0.5, 0.5, 0.5, 32]} />
        <meshStandardMaterial color="#1e293b" metalness={0.7} roughness={0.2} />
      </mesh>
      <mesh castShadow position={[3, 2.5, 3.2]}>
        <cylinderGeometry args={[0.5, 0.5, 0.5, 32]} />
        <meshStandardMaterial color="#1e293b" metalness={0.7} roughness={0.2} />
      </mesh>
    </group>
  );
}

// Axis helper component
function AxisHelper() {
  return (
    <group>
      {/* X axis - Red */}
      <arrowHelper args={[new THREE.Vector3(1, 0, 0), new THREE.Vector3(0, 0, 0), 5, 0xff0000]} />
      {/* Y axis - Green */}
      <arrowHelper
        args={[new THREE.Vector3(0, 1, 0), new THREE.Vector3(0, 0, 0), 5, 0x00ff00]}
      />
      {/* Z axis - Blue */}
      <arrowHelper args={[new THREE.Vector3(0, 0, 1), new THREE.Vector3(0, 0, 0), 5, 0x0000ff]} />
    </group>
  );
}

// Ground plane
function GroundPlane() {
  return (
    <mesh receiveShadow rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, 0]}>
      <planeGeometry args={[100, 100]} />
      <shadowMaterial opacity={0.2} />
    </mesh>
  );
}

interface ViewportProps {
  showStats?: boolean;
}

export function Viewport({ showStats = process.env.NODE_ENV === 'development' }: ViewportProps) {
  const controlsRef = useRef<any>();

  return (
    <div className="w-full h-full bg-gradient-to-b from-slate-800 to-slate-900">
      <Canvas
        shadows
        gl={{
          antialias: true,
          toneMapping: THREE.ACESFilmicToneMapping,
          toneMappingExposure: 1.2,
        }}
      >
        {/* Camera */}
        <PerspectiveCamera makeDefault position={[10, 10, 10]} fov={50} />

        {/* Lights */}
        <ambientLight intensity={0.4} />
        <directionalLight
          position={[10, 20, 15]}
          intensity={1.5}
          castShadow
          shadow-mapSize-width={2048}
          shadow-mapSize-height={2048}
          shadow-camera-far={50}
          shadow-camera-left={-20}
          shadow-camera-right={20}
          shadow-camera-top={20}
          shadow-camera-bottom={-20}
        />
        <directionalLight position={[-10, 10, -10]} intensity={0.5} />
        <hemisphereLight args={['#ffffff', '#60a5fa', 0.3]} />

        {/* Environment for reflections */}
        <Environment preset="city" />

        {/* Grid */}
        <Grid
          args={[100, 100]}
          cellSize={1}
          cellThickness={0.5}
          cellColor="#64748b"
          sectionSize={10}
          sectionThickness={1}
          sectionColor="#94a3b8"
          fadeDistance={50}
          fadeStrength={1}
          followCamera={false}
          infiniteGrid
        />

        {/* Ground plane for shadows */}
        <GroundPlane />

        {/* Axis helper */}
        <AxisHelper />

        {/* Sample geometry */}
        <SampleGeometry />

        {/* Controls */}
        <OrbitControls
          ref={controlsRef}
          makeDefault
          enableDamping
          dampingFactor={0.05}
          minDistance={5}
          maxDistance={100}
          maxPolarAngle={Math.PI / 2}
        />

        {/* Performance stats */}
        {showStats && <Stats />}
      </Canvas>

      {/* Viewport info overlay */}
      <div className="absolute bottom-4 left-4 bg-black/50 backdrop-blur-sm px-3 py-2 rounded-lg text-xs text-white font-mono">
        <div>Camera: Perspective</div>
        <div>View: Isometric</div>
        <div className="text-gray-400 mt-1">Scroll: Zoom | Drag: Rotate | Right-drag: Pan</div>
      </div>
    </div>
  );
}
