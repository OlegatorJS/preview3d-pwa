import React from 'react';
import logo from './logo.svg';
import './App.css';
import PreviewModule from "artpix-3d-preview";

function App() {
  return (
    <div className="App" style={{height:"100vh"}}>
      <PreviewModule
          id="28537352-7eac-489b-aa53-161973321b55"
          env="https://orderarchive.okd.artpix3d.com"
          isMobile
      />
    </div>
  );
}

export default App;
