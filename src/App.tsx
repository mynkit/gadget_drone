import React, { useState, useEffect } from 'react'
import Cannon from "./components/Cannon"
import { useWindowDimensions } from "./utils/windowDimensions";

const App: React.FC = () => {
  const [sharedArrayBufferEnable, setSharedArrayBufferEnable] = useState(false);
  const [booting, setBooting] = useState(false);
  const { width, height } = useWindowDimensions()
  useEffect(() => {
    try {
      new SharedArrayBuffer(1);
      setSharedArrayBufferEnable(true);
    } catch {
      setSharedArrayBufferEnable(false);
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