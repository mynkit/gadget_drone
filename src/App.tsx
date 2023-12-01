import React, { useState, useEffect } from 'react'
import Cannon from "./components/Cannon"

const App: React.FC = () => {
  const [sharedArrayBufferEnable, setSharedArrayBufferEnable] = useState(false);
  const [booting, setBooting] = useState(false);
  useEffect(() => {
    try{
      new SharedArrayBuffer(1);
      setSharedArrayBufferEnable(true);
    }catch{
      setSharedArrayBufferEnable(false);
    }
  }, [])
  return (
    <div style={{width: "100vw", height: "100vh"}}>
      <Cannon
        sharedArrayBufferEnable={sharedArrayBufferEnable}
        booting={booting}
        setBooting={setBooting}
      />
    </div>
  )
}

export default App