import React, { useState, useEffect } from 'react'
import Cannon from "./components/Cannon"
import { useWindowDimensions } from "./utils/windowDimensions";

const App: React.FC = () => {
  const [sharedArrayBufferEnable, setSharedArrayBufferEnable] = useState(-1);
  const [booting, setBooting] = useState(false);
  const { width, height } = useWindowDimensions()
  useEffect(() => {
    try {
      new SharedArrayBuffer(1);
      setSharedArrayBufferEnable(1);
    } catch {
      setSharedArrayBufferEnable(0);
    }
  }, [])
  return (
    <div style={{ width: width, height: height, fontFamily: `"Noto Sans JP", sans-serif` }}>
      <Cannon
        sharedArrayBufferEnable={sharedArrayBufferEnable}
        booting={booting}
        setBooting={setBooting}
      />
    </div>
  )
}

export default App