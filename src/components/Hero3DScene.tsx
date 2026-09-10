import { Canvas } from '@react-three/fiber';
import { Float, OrbitControls, Sphere, MeshDistortMaterial } from '@react-three/drei';

function FloatingShape() {
  return (
    <Float speed={2.5} rotationIntensity={1.5} floatIntensity={2}>
      {/* Central 3D Distorted Crystal/Sphere */}
      <Sphere args={[1, 64, 64]} scale={1.8}>
        <MeshDistortMaterial
          color="#7D1234"
          attach="material"
          distort={0.4}
          speed={2}
          roughness={0.2}
          metalness={0.8}
        />
      </Sphere>
      
      {/* Secondary Floating Ring */}
      <mesh rotation={[Math.PI / 4, 0, 0]} scale={2.6}>
        <torusGeometry args={[1, 0.05, 16, 100]} />
        <meshStandardMaterial color="#e4698d" roughness={0.1} metalness={0.9} />
      </mesh>
    </Float>
  );
}

export default function Hero3DScene() {
  return (
    <div className="w-full h-[350px] sm:h-[450px] relative">
      <Canvas camera={{ position: [0, 0, 6], fov: 45 }}>
        {/* Realistic Lighting */}
        <ambientLight intensity={0.7} />
        <directionalLight position={[10, 10, 5]} intensity={1.5} color="#ffffff" castShadow />
        <pointLight position={[-10, -10, -5]} intensity={0.5} color="#e4698d" />

        {/* 3D Floating Geometry */}
        <FloatingShape />

        {/* Mouse Interaction Controls */}
        <OrbitControls enableZoom={false} autoRotate autoRotateSpeed={1.5} />
      </Canvas>

      <div className="absolute bottom-2 left-1/2 -translate-x-1/2 text-xs font-mono text-slate-400 bg-slate-900/60 px-3 py-1 rounded-full backdrop-blur-md border border-white/10 pointer-events-none">
        Interactive 3D • Drag to rotate
      </div>
    </div>
  );
}
