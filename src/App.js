import React, {useRef} from 'react';
import './App.css';
import PreviewModule from "./PreviewModule";

function App() {
    const containerRef = useRef(null);
  return (
    <div className="App" style={{height:"100vh"}} ref={containerRef}>
      <PreviewModule
          id="28537352-7eac-489b-aa53-161973321b55"
          env="https://orderarchive.okd.artpix3d.com"
          isMobile
          portrait={containerRef.current}
      />
    </div>
  );
}

export default App;
