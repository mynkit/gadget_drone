import type { PlaneProps, Triplet } from '@react-three/cannon'
import { Physics, useBox, usePlane, useSphere } from '@react-three/cannon'
import { Canvas, useFrame } from '@react-three/fiber'
import { useMemo, useRef, useState } from 'react'
import type { InstancedMesh, Mesh } from 'three'
import { Color } from 'three'

interface WallProps {
  position: [x: number, y: number, z: number];
  scale: [x: number, y: number, z: number];
  color: string;
}

const Wall = (props: WallProps) => {
  const [ref] = useBox(() => ({
    type: 'Static',
    position: props.position,
    args: props.scale,
  }), useRef<Mesh>(null));

  return (
    <mesh ref={ref} position={props.position}>
      <boxGeometry args={props.scale} />
      <meshStandardMaterial color={props.color} />
    </mesh>
  );
};

const Plane = (props: PlaneProps) => {
  const [ref] = usePlane(() => ({ ...props }), useRef<Mesh>(null))
  return (
    <mesh ref={ref} receiveShadow>
      <planeGeometry args={[5, 5]} />
      <shadowMaterial color="#171717" />
    </mesh>
  )
}

type InstancedGeometryProps = {
  colors: Float32Array
  number: number
  size: number
}

const Spheres = ({ colors, number, size }: InstancedGeometryProps) => {
  const [ref, { at }] = useSphere(
    () => ({
      args: [size],
      mass: 1,
      position: [Math.random() - 0.5, Math.random() * 2, Math.random() - 0.5],
    }),
    useRef<InstancedMesh>(null),
  )
  useFrame(() => at(Math.floor(Math.random() * number)).position.set(0, Math.random() * 2, 0))
  return (
    <instancedMesh receiveShadow castShadow ref={ref} args={[undefined, undefined, number]}>
      <sphereGeometry args={[size, 48]}>
        <instancedBufferAttribute attach="attributes-color" args={[colors, 3]} />
      </sphereGeometry>
      <meshLambertMaterial vertexColors />
    </instancedMesh>
  )
}

const Boxes = ({ colors, number, size }: InstancedGeometryProps) => {
  const args: Triplet = [size, size, size]
  const [ref, { at }] = useBox(
    () => ({
      args,
      mass: 1,
      position: [Math.random() - 0.5, Math.random() * 2, Math.random() - 0.5],
    }),
    useRef<InstancedMesh>(null),
  )
  useFrame(() => at(Math.floor(Math.random() * number)).position.set(0, Math.random() * 2, 0))
  return (
    <instancedMesh receiveShadow castShadow ref={ref} args={[undefined, undefined, number]}>
      <boxGeometry args={args}>
        <instancedBufferAttribute attach="attributes-color" args={[colors, 3]} />
      </boxGeometry>
      <meshLambertMaterial vertexColors />
    </instancedMesh>
  )
}

const instancedGeometry = {
  box: Boxes,
  sphere: Spheres,
}

const Cannon = () => {
  const [geometry, setGeometry] = useState<'sphere'>('sphere')
  const [number] = useState(150)
  const [size] = useState(0.1)

  const colors = useMemo(() => {
    const array = new Float32Array(number * 3)
    const color = new Color()
    for (let i = 0; i < number; i++)
      color
        // .set(niceColors[Math.floor(Math.random() * 5)])
        .convertSRGBToLinear()
        .toArray(array, i * 3)
    return array
  }, [number])

  const InstancedGeometry = instancedGeometry[geometry]

  return (
    <Canvas
      shadows
      gl={{
        alpha: false,
        // todo: stop using legacy lights
        useLegacyLights: true,
      }}
      camera={{ fov: 40, position: [0, 7, 0] }}
      // camera={{ fov: 40, position: [0, 0, 7] }}
      onPointerMissed={() => setGeometry("sphere")}
      onCreated={({ scene }) => (scene.background = new Color('lightblue'))}
    >
      <hemisphereLight intensity={0.35} />
      <spotLight
        position={[7, 7, 7]}
        angle={0.3}
        penumbra={1}
        intensity={2}
        castShadow
        shadow-mapSize-width={256}
        shadow-mapSize-height={256}
      />
      <Physics broadphase="SAP">
        <Plane rotation={[-Math.PI / 2, 0, 0]} />
        {/* Right */}
        <Wall position={[2.5, 0.5, 0]} scale={[0.1, 1, 10]} color="lightblue" />
        {/* Left */}
        <Wall position={[-2.5, 0.5, 0]} scale={[0.1, 1, 10]} color="lightblue" />
        {/* Front */}
        <Wall position={[0, 0.5, -2.5]} scale={[10, 1, 0.1]} color="lightblue" />
        {/* Back */}
        <Wall position={[0, 0.5, 2.5]} scale={[10, 1, 0.1]} color="lightblue" />
        <InstancedGeometry {...{ colors, number, size }} />
      </Physics>
    </Canvas>
  )
}
export default Cannon