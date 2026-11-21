import React, { Suspense } from "react";
import { Canvas } from "@react-three/fiber";
import {
  Float,
  MeshDistortMaterial,
  OrbitControls,
  Sparkles,
} from "@react-three/drei";

function Core() {
  return (
    <Float speed={1.25} rotationIntensity={0.45} floatIntensity={0.8}>
      <mesh scale={1.48}>
        <icosahedronGeometry args={[1, 5]} />
        <MeshDistortMaterial
          color="#397cff"
          emissive="#123b9a"
          emissiveIntensity={0.72}
          roughness={0.16}
          metalness={0.72}
          distort={0.34}
          speed={1.7}
        />
      </mesh>
      <mesh scale={1.78}>
        <icosahedronGeometry args={[1, 2]} />
        <meshBasicMaterial
          color="#75d9ff"
          wireframe
          transparent
          opacity={0.2}
        />
      </mesh>
    </Float>
  );
}

export default function Orb({ compact = false }) {
  return (
    <div className={`orb-canvas ${compact ? "orb-compact" : ""}`}>
      <Canvas camera={{ position: [0, 0, 5.1], fov: 42 }} dpr={[1, 1.6]}>
        <ambientLight intensity={0.8} />
        <pointLight position={[4, 3, 4]} intensity={28} color="#73caff" />
        <pointLight position={[-4, -2, 2]} intensity={18} color="#536bff" />
        <Suspense fallback={null}>
          <Core />
          <Sparkles
            count={compact ? 30 : 75}
            scale={4.8}
            size={2.1}
            speed={0.3}
            color="#8edfff"
          />
        </Suspense>
        <OrbitControls
          enableZoom={false}
          enablePan={false}
          autoRotate
          autoRotateSpeed={0.55}
        />
      </Canvas>
    </div>
  );
}
