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
  const nodeIdRef = useRef(1);
  const [ref, { at }] = useSphere(
    () => ({
      args: [size],
      mass: 1,
      position: [3*Math.random()-1.5, Math.random() * 0.15, 3*Math.random() - 1.5], // 初期位置
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

    const velocity = e.contact.impactVelocity
    const velocityMinTh = 0.3
    const velocityTh = 30
    if (velocity<velocityMinTh) return

    // console.log(e.contact.impactVelocity)

    const bubbleSizeMin = 18.;
    const bubbleSizeMax = 100.;
    let amp = 1.;
    if(amp<0.01){return;}
    let rand = Math.random();
    let sustain = map(rand, 0, 1, 1/bubbleSizeMax, Math.min(1/bubbleSizeMin, 0.08)) *1.2;
    let freq = map(Math.sqrt(rand), 0, 1, bubbleSizeMax**2, bubbleSizeMin**2) * 1;
    let accelerate = map(rand, 0, 1, Math.sqrt(300/bubbleSizeMax), Math.sqrt(300/bubbleSizeMin));
    let lpf = 10000;
    amp = amp * map(rand*rand, 0, 1, 0.1, 1);
    amp = amp * map(Math.random()*Math.random(), 0, 1, 0, 1);
    if (velocity<velocityTh) {
      amp = amp * (Math.min(velocity*(1./velocityTh), 1.)**0.8);
    }
    // console.log(`nodeId: ${nodeIdRef.current}`)
    run(`s_sinewave(${amp*0.3}, ${sustain}, ${0}, ${freq}, ${accelerate}, ${lpf}, ${nodeIdRef.current})`);
    nodeIdRef.current += 1;
    if (nodeIdRef.current > 3000) {
      nodeIdRef.current = 1;
    }
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
  const [number] = useState(170)
  const [size] = useState(0.11)
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