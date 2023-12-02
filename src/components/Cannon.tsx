import type { PlaneProps, Triplet } from '@react-three/cannon'
import { Physics, useBox, usePlane, useSphere, CollideEvent, } from '@react-three/cannon'
import { Canvas, useFrame } from '@react-three/fiber'
import { useMemo, useRef, useState, useEffect } from 'react'
import type { InstancedMesh, Mesh } from 'three'
import { Color } from 'three'
import Grid from '@mui/material/Grid'
import { run } from '../utils/runScript'
import { isSmartPhone } from '../utils/computerTerminal'
import { map } from '../utils/mathFunc'

const isTouchDevice = isSmartPhone();

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
  isTouched: boolean
  touchPosition: XY
  originXYToCanvasXY: (originXY: XY) => XY
}

const Spheres = ({ colors, number, size, isTouched, touchPosition, originXYToCanvasXY }: InstancedGeometryProps) => {
  const [frame, setFrame] = useState(0);
  const [ref, { at }] = useSphere(
    () => ({
      args: [size],
      mass: 1,
      position: [2*Math.random() - 1, Math.random() * 0.2, 2*Math.random() - 1], // 初期位置
      onCollide: handleCollide,
    }),
    useRef<InstancedMesh>(null),
  )
  useFrame(() => {
    setFrame(frame+1)
    if (frame%2==0) return
    if (isTouched) {
      const xy = originXYToCanvasXY(touchPosition)
      at(Math.floor(Math.random() * number)).position.set(xy.x, Math.random() * 2, xy.y)
    }
  })
  useEffect(()=>{
    if (frame>=60){
      setFrame(0)
    }
  }, [frame])

  const handleCollide = (e: CollideEvent) => {
    e.contact.contactPoint // 衝突した座標
    e.contact.impactVelocity // 衝突したときの速度
    // console.log(e.contact.contactPoint, e.contact.impactVelocity)
  }

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

type ScProps = {
  sharedArrayBufferEnable: boolean;
  booting: boolean;
  setBooting: React.Dispatch<React.SetStateAction<boolean>>;
}

type XY = {
  x: number;
  y: number;
}

const Cannon: React.FC<ScProps> = ({ sharedArrayBufferEnable, booting, setBooting }) => {
  const [geometry, setGeometry] = useState<'sphere'|'box'>('sphere')
  const [number] = useState(150)
  const [size] = useState(0.1)
  const [widthRate, setWidthRate] = useState(1)
  const [width, setWidth] = useState(0)
  const [height, setHeight] = useState(0)
  const [isTouched, setIsTouched] = useState(false)
  const [touchPosition, setTouchPosition] = useState<XY>({x: 0, y: 0})

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

  const boot = () => {
    run(`boot();d_sinewave();d_pinknoise();`);
    setBooting(true);
  }

  const originXYToCanvasXY = (originXY: XY) => {
    const originX = originXY.x;
    const originY = originXY.y;
    let canvasX = map(originX, Math.max((width-height)/2., 0), width - Math.max((width-height)/2., 0), -1.8*widthRate, 1.8*widthRate)
    let canvasY = map(originY, 0, height, -1.8, 1.8)
    return {x: canvasX, y: canvasY}
  }

  useEffect(() => {
    const width = window.innerWidth
    const height = window.innerHeight
    setWidth(width)
    setHeight(height)
    setWidthRate(Math.min(width / height, 1))
  }, [])

  useEffect(() => {
    const preventDefault = (e: any) => e.preventDefault();
    if (isTouched) {
      document.addEventListener('touchmove', preventDefault, {passive: false});
    } else {
      document.removeEventListener('touchmove', preventDefault, false);
    }
    return () => document.removeEventListener('touchmove', preventDefault, false);
  }, [isTouched])

  return (
    <>
      <Grid
        container
        justifyContent='center'
        alignItems='center'
        width='100vw'
        height='100vh'
        style={{position: 'absolute', zIndex: 100, fontSize: '15pt',}}
        onTouchStart={(e: React.TouchEvent<HTMLDivElement>)=>{if(isTouchDevice){setIsTouched(true);const touch=e.touches[0];if(touch){setTouchPosition({x: touch.clientX, y: touch.clientY})}}}}
        onTouchEnd={(_: React.TouchEvent<HTMLDivElement>)=>{if(isTouchDevice){setIsTouched(false)}}}
        onTouchMove={(e: React.TouchEvent<HTMLDivElement>)=>{if(isTouchDevice){const touch=e.touches[0];if(touch){setTouchPosition({x: touch.clientX, y: touch.clientY})}}}}
        onMouseDown={(e: React.MouseEvent<HTMLDivElement>)=>{if(!isTouchDevice){setIsTouched(true);setTouchPosition({x: e.clientX, y: e.clientY});}}}
        onMouseUp={(_: React.MouseEvent<HTMLDivElement>)=>{if(!isTouchDevice){setIsTouched(false)}}}
        onMouseMove={(e: React.MouseEvent<HTMLDivElement>)=>{if(!isTouchDevice){setTouchPosition({x: e.clientX, y: e.clientY});}}}
      >
        {booting ? `` : `PLAY!`}
        <Grid justifyContent='center' alignItems='center' style={{
          position: 'absolute',
          cursor: booting || !sharedArrayBufferEnable ? 'default' : 'pointer',
          width: Math.min(height * 0.25, width * 0.8),
          height: Math.min(height * 0.25, width * 0.8),
          border: booting || !sharedArrayBufferEnable ? '0px' : '1px solid',
          borderRadius: '50%',
          borderColor: booting || !sharedArrayBufferEnable ? '#ccc' : 'black',
          color: booting || !sharedArrayBufferEnable ? '#ccc' : 'black',
        }} onClick={()=>{if(!booting && sharedArrayBufferEnable)boot()}}>
        </Grid>
        {/* {isTouched ? "isTouched" : <></>} */}
      </Grid>
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
          <Wall position={[2.5*widthRate, 0.5, 0]} scale={[0.1, 1, 10]} color="lightblue" />
          {/* Left */}
          <Wall position={[-2.5*widthRate, 0.5, 0]} scale={[0.1, 1, 10]} color="lightblue" />
          {/* Front */}
          <Wall position={[0, 0.5, -2.5]} scale={[10, 1, 0.1]} color="lightblue" />
          {/* Back */}
          <Wall position={[0, 0.5, 2.5]} scale={[10, 1, 0.1]} color="lightblue" />
          {booting ? <InstancedGeometry {...{ colors, number, size, isTouched, touchPosition, originXYToCanvasXY }} /> : <></>}
        </Physics>
      </Canvas>
    </>
  )
}
export default Cannon