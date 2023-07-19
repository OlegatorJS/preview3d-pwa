/* eslint-disable */
import * as THREE from "three";

import React, { Suspense, useEffect, useRef, useState } from "react";

import { OrbitControls, useTexture } from "@react-three/drei";
import { Canvas, useThree } from "@react-three/fiber";
import axios from "axios";
import JSZip from "jszip";
import JSZipUtils from "jszip-utils";


import "./App.css";
import ProgressBar from "react-customizable-progressbar";
import { OBJLoader } from "three/examples/jsm/loaders/OBJLoader";

import mouseIcon from "./assets/Mouse.png";
import px from "./assets/px.jpg";
import touchIcon from "./assets/Touch.png";

const PreviewModule = ({
    id,
    isMobile,
    showControls = false,
    onSuccessRender = () => {}, // callback on 3d preview done,
    manualSettings = {},
    onRenderOpacity = () => {},
    isMobileApp = false,
    mobileDimensions = {},
    portrait,
}) => {
    const [testObj, setTestObj] = useState("");
    const [changeValue, setChangeValue] = useState(0.005);
    const [opacity, setOpacity] = useState(0.1);
    const [pointSize, setPointSize] = useState(1);
    const [zoomValue, setZoomValue] = useState(2);
    const [simpleProportion, setSimpleProportion] = useState(false);
    const [autoCalculate, setAutoCalculate] = useState(true);
    const [testPortrait, setTestPortrait] = useState("");
    const [shape, setShape] = useState("Rectangle Small +");
    const [currentObject, setCurrentObject] = useState(null);
    const [testShape, setTestShape] = useState(null);
    const [flag, setFlag] = useState(false);
    const [showText, setShowText] = useState(true);
    const [crystalData, setCrystalData] = useState({});
    const [objectInfo, setObjectInfo] = useState({});
    const [progress, setProgress] = useState(0);
    const [showProcessing, setShowProcessing] = useState(false);
    const [shapeRotation, setShapeRotation] = useState([0, 0, 1.5708]);
    const [objectRotation, setObjectRotation] = useState([0, 0, 0]);
    const group = useRef(null);
    const basicSize = useRef(null);
    const progressIntervalRef = useRef(null);
    const oldLogic = ["3CRZ", "3CRA", "3CRT", "3CSY", "3CHX", "3CIL", "3CIM"];
    const objTestLoader = new OBJLoader();

    const getPreview = () => {
        axios
            .get(`https://orderarchive.okd.artpix3d.com/api/v1/shop/preview-3d/e01f01eb-f2a0-4586-9a04-ecda9a2b0a54`)
            .then(({ data }) => {
                setObjectInfo(data.data);
                setCurrentObject(data.data.file_url);
                setTestShape(data.data.shape_url);
                setCrystalData(data.data.crystal);
                basicSize.current = data.data.crystal;
            })
            .catch(error => {
                console.warn(error.response.data.errors);
            })
    };

    const parseBinary = file => {
        if (file.length) {
            const geometry = new THREE.BufferGeometry();
            const vertices = [];
            let outerCounter = 0;
            let innerCounter = 0;
            let pointsInLayer = 0;
            let multipleZValue = 0;
            let multipleXValue = 0;
            let multipleYValue = 0;

            if (oldLogic.some(item => item === basicSize.current.sku)) {
                for (let i = 14; i < file.length; i += 4) {
                    ++innerCounter;
                    if (pointsInLayer) {
                        outerCounter = 2 * pointsInLayer + 1;
                        if (innerCounter === 1) {
                            multipleZValue = new Float32Array(new Uint8Array([file[i - 3], file[i - 2], file[i - 1], file[i]]).buffer)[0];
                        } else if (innerCounter % 2 === 0) {
                            multipleXValue = new Float32Array(new Uint8Array([file[i - 3], file[i - 2], file[i - 1], file[i]]).buffer)[0];
                        } else if (innerCounter % 3 === 0) {
                            multipleYValue = new Float32Array(new Uint8Array([file[i - 3], file[i - 2], file[i - 1], file[i]]).buffer)[0];
                            vertices.push(multipleXValue, multipleYValue, multipleZValue);
                        }
                    }

                    if (innerCounter > outerCounter) {
                        pointsInLayer = new Uint32Array(new Uint8Array([file[i - 3], file[i - 2], file[i - 1], file[i]]).buffer)[0];
                        innerCounter = 0;
                        outerCounter = 0;
                    }
                    if (i >= file.length - 10) {
                        geometry.setAttribute("position", new THREE.Float32BufferAttribute(vertices, 3));
                        setFlag(prevState => !prevState);
                        setTestObj(geometry);
                        onSuccessRender();
                        return
                    }
                }
            } else {
                for (let i = 14; i < file.length; i += 4) {
                    ++innerCounter;
                    if (pointsInLayer) {
                        outerCounter = 2 * pointsInLayer + 1;
                        if (innerCounter === 1) {
                            multipleZValue = new Float32Array(new Uint8Array([file[i - 3], file[i - 2], file[i - 1], file[i]]).buffer)[0];
                        } else if (innerCounter % 2 === 0) {
                            multipleXValue = new Float32Array(new Uint8Array([file[i - 3], file[i - 2], file[i - 1], file[i]]).buffer)[0];
                        } else if (innerCounter % 2 !== 0) {
                            multipleYValue = new Float32Array(new Uint8Array([file[i - 3], file[i - 2], file[i - 1], file[i]]).buffer)[0];
                            vertices.push(multipleXValue, multipleYValue, multipleZValue);
                        }
                    }

                    if (innerCounter > outerCounter) {
                        pointsInLayer = new Uint32Array(new Uint8Array([file[i - 3], file[i - 2], file[i - 1], file[i]]).buffer)[0];
                        innerCounter = 0;
                        outerCounter = 0;
                    }
                    if (i >= file.length - 10) {
                        geometry.setAttribute("position", new THREE.Float32BufferAttribute(vertices, 3));
                        setFlag(prevState => !prevState);
                        setTestObj(geometry);
                        onSuccessRender();
                        return
                    }
                }
            }
        }
    }

    const listener = () => {
        setShowText(false)
    };

    const handleOpacity = type => {
        setAutoCalculate(false);
        type === "decrease"
        ? setOpacity(prevState => prevState - Number(changeValue))
        : setOpacity(prevState => prevState + Number(changeValue))
    }

    const handlePointSize = type => {
        setAutoCalculate(false);
        type === "decrease"
        ? setPointSize(prevState => prevState - 0.1)
        : setPointSize(prevState => prevState + 0.1)
    }

    const handleZoom = type => {
        setAutoCalculate(false);
        type === "decrease"
        ? zoomValue > 0.2 && setZoomValue(prevState => prevState - 0.2)
        : setZoomValue(prevState => prevState + 0.2)
    }

    const Shape = ({rotation}) => {
        const { gl, scene, camera } = useThree();
        const model = useRef(null);
        const texture = useTexture(px);
        const parentContainer =  isMobileApp ? mobileDimensions :document?.getElementById("preview-3d").parentElement;

        const material = new THREE.MeshBasicMaterial({
            color: "#049ef4"
        });
        let rotationValue = crystalData?.form === "Iceberg" ? [0, 0, 1.5708] : [0, 0, 1.5708];

        if (crystalData?.sku === "2OHM") {
            rotationValue = [0, 0, 0.785398];
        }

        if(crystalData?.crystal_3d_model_setting?.shape_rotation > 0) {
            const pi = Math.PI;
            rotationValue = [0, 0, crystalData?.crystal_3d_model_setting?.shape_rotation * (pi/180)];
        }

        if(manualSettings?.shape_rotation > 0) {
            const pi = Math.PI;
            rotationValue = [0, 0, manualSettings?.shape_rotation * (pi/180)];
        }

        scene.background = texture;
        gl.setSize(parentContainer.clientWidth, parentContainer.clientHeight);

        typeof window !== "undefined" && gl.setPixelRatio(window?.devicePixelRatio);

        camera.updateProjectionMatrix();
        return (
            shape
            ? <lineSegments
                ref={model}
                geometry={shape?.children[0]?.geometry}
                position={[0, 0, 0]}
                material={material}
                rotation={rotation}
            />
            : null
        )
    }

    const Portrait = ({ object, rotation }) => {
        const parentContainer =  isMobileApp ? mobileDimensions :document?.getElementById("preview-3d").parentElement;
        const group = useRef(null);
        const { camera } = useThree();
        let defaultOpacity = {
            small: 0.11,
            medium: 0.071,
            large: 0.041,
            xxl: 0.015,
            xxxl: 0.017,
            max: 0.014,
            titan: 0.01,
        }

        if (crystalData?.form?.toLowerCase() === "iceberg") {
            defaultOpacity = {
                small: 0.023,
                medium: 0.015,
                large: 0.039,
            }
        }

        if (crystalData?.type?.toLowerCase() === "keychain") {
            defaultOpacity = {
                small: 0.307,
                medium: 0.32,
                large: 0.257,
            }
        }

        if (crystalData?.form?.toLowerCase() === "heart") {
            defaultOpacity = {
                small: 0.06,
                medium: 0.04,
                large: 0.02,
            }
        }

        if (crystalData?.form?.toLowerCase() === "square") {
            defaultOpacity = {
                small: 0.05,
                medium: 0.04,
                large: 0.02,
            }
        }

        if (crystalData?.type?.toLowerCase() === "necklace") {
            defaultOpacity = {
                small: 0.2,
                medium: 0.18,
                large: 0.15,
            }
        }

        if (autoCalculate) {
            let desctopOpacity;
            let manualOpacity;
            if(crystalData?.crystal_3d_model_setting?.transparency > 0) {
                manualOpacity= crystalData?.crystal_3d_model_setting?.transparency * 0.01;
            }

            if(manualSettings?.transparency > 0) {
                manualOpacity= manualSettings?.transparency * 0.01;
            }
            let currentZoom = (parentContainer?.clientHeight - parentContainer?.clientHeight * (crystalData?.size_mm_y > 151 ? 0.1 : 0.25))/crystalData?.size_mm_y;
            if (oldLogic.some(item => item === basicSize.current.sku)) {
                desctopOpacity = (0.1 * (parentContainer?.clientHeight / 600) - (1 - 80 / crystalData?.size_mm_y) * 0.1);
            } else {
                desctopOpacity = (manualOpacity || defaultOpacity[crystalData?.size?.toLowerCase()]) * (parentContainer?.clientHeight * (isMobile ? 0.8 : 1.2) / 600);
            }
            // Mobile zoom
            if (isMobile) {
                const xZoom = (parentContainer?.clientWidth - parentContainer?.clientWidth *  0.2)/crystalData?.size_mm_x;
                const yZoom = (parentContainer?.clientHeight - parentContainer?.clientHeight *  0.2)/crystalData?.size_mm_y;
                currentZoom = yZoom < xZoom ? yZoom : xZoom;
            }
            if (desctopOpacity < 0.01) {
                desctopOpacity = 0.01
            }
            if (parentContainer?.clientHeight < 500) {
                desctopOpacity *= 0.8;
            }

            if (crystalData?.type?.toLowerCase() === "necklace") {
                currentZoom = (parentContainer?.clientHeight - parentContainer?.clientHeight * 0.55)/crystalData?.size_mm_y;
            }

            onRenderOpacity(desctopOpacity);

            setOpacity(desctopOpacity);
            setZoomValue(currentZoom);
        }
        camera.zoom = zoomValue;
        let rotationValue = crystalData?.form === "Iceberg" ? [0, 0, 1.5708] : [0, 0, 0];
        if (objectInfo?.position?.toLowerCase() === "landscape") {
            rotationValue = [0, 0, 0];
        }

        if (crystalData?.form?.toLowerCase() === "diamond") {
            rotationValue = [0, 0, 0.785398];
        }

        if (crystalData?.sku === "2OOM") {
            rotationValue = [0, 0, 0.405398];
        }

        if (crystalData?.sku === "2OHM" || crystalData?.sku === "2OSM") {
            rotationValue = [0, 0, 0.785398];
        }

        // Wine Stopper
        if (crystalData?.sku === "3WRS" || crystalData?.sku === "3WOS") {
            rotationValue = [0, 0, 3.14159];
        }
        camera.updateProjectionMatrix();

        if(crystalData?.crystal_3d_model_setting?.model_rotation > 0) {
            const pi = Math.PI;
            rotationValue = [0, 0, crystalData?.crystal_3d_model_setting?.model_rotation * (pi/180)];
        }

        if(manualSettings?.model_rotation > 0) {
            const pi = Math.PI;
            rotationValue = [0, 0, manualSettings?.model_rotation * (pi/180)];
        }

        console.log("opacity", opacity);

        return (
            <points
                geometry={object}
                ref={group}
                scale={[1, 1, 1]}
                rotation={rotation}
            >
                <pointsMaterial
                    color="#fff"
                    transparent={true}
                    depthTest={false}
                    depthWrite={false}
                    opacity={opacity}
                    size={pointSize}
                    sizeAttenuation={false}
                />
            </points>
        )
    };

    useEffect(() => {
        setShowText(true);
        setAutoCalculate(true);
        setObjectInfo({});
        setCurrentObject(null);
        setTestShape(null);
        setCrystalData({});
        setShowProcessing(false);
        setFlag(false);
        setTestPortrait("");
        setProgress(0);
        clearInterval(progressIntervalRef.current);
        getPreview();
    }, [id])

    useEffect(() => {
        if(currentObject){
            new JSZip.external.Promise((resolve, reject) => {
                progressIntervalRef.current = setInterval(()=>{
                    if(progress <= 50){
                        setProgress(prevState => prevState + 1)
                    }
                },450)
                JSZipUtils.getBinaryContent(currentObject, (err, data) => {
                    if (err) {
                        console.error(err)
                        reject(err);
                    }
                    JSZip.loadAsync(data)
                        .then((zip) => {
                            Object.keys(zip.files).forEach(filename => {
                                if(zip.files[filename]){
                                    zip.files[filename].async("uint8array").then(fileData => {
                                        parseBinary(fileData);
                                        clearInterval(progressIntervalRef.current);
                                        progressIntervalRef.current = setInterval(()=>{
                                            if ( progress <= 90){
                                                setProgress(prevState => prevState + 1)
                                            }
                                        },150)
                                    })
                                }
                            })
                        })
                });
            });
        }
    }, [currentObject]);

    useEffect(() => {
        if(progress >= 100){
            clearInterval(progressIntervalRef.current);
            setShowProcessing(true);
        }
    },[progress])

    useEffect(() => {
        if(testPortrait && !isMobileApp){
            const preview = document?.getElementById("preview-3d");
            preview.addEventListener("mousedown", listener);
            preview.addEventListener("touchstart", listener);
            return () => {
                preview.removeEventListener("mousedown", listener);
                preview.removeEventListener("touchstart", listener);
            };
        }
    }, [testPortrait])

    useEffect(() => {
        if (testObj) {
            setTestPortrait(testObj);
        }
    }, [testObj, flag]);

    useEffect(() => {
        if(testShape) {
            objTestLoader.load(testShape, object => {
                setShape(object);
            });
        }
    }, [testShape]);

    const orientationChange = event => {
        console.log(
            `the orientation of the device is now ${event.target.screen.orientation.angle}`,
        );
        if (event.target.screen.orientation.angle === 90) {
            setObjectRotation([0, 0, 1.5708]);
            setShapeRotation([0, 0, 0])
        } else {
            setObjectRotation([0, 0, 0]);
            setShapeRotation([0, 0, 1.5708])
        }
    }

    useEffect(() => {
        addEventListener("orientationchange", (event) => orientationChange(event));
        removeEventListener("orientationchange", () => orientationChange())
    }, []);

    return (
        <div id="preview-3d">
            {testPortrait && showProcessing
             ? <>
                 {showText &&
                     <div className="tap-to-continue" onClick={() => setShowText(false)}>
                         <p>
                             Use your {isMobile ? "fingers" : "mouse"} to rotate and zoom the model.
                         </p>
                          <img src={isMobile ? touchIcon : mouseIcon} alt="tap" />
                     </div>
                 }
                 {
                     showControls
                     ?   <div className="select-wrapper">
                         <div className="row-item">
                             <div>
                                 <p style={{ color: "#fff" }}>Transparency: <b>{opacity?.toFixed(3)}</b></p>
                                 <button style={{ padding: "10px", backgroundColor: "grey", color: "black" }} onClick={() => handleOpacity("decrease")}>-</button>
                                 <button style={{ padding: "10px", backgroundColor: "grey", color: "black" }} onClick={() => handleOpacity("increase")}>+</button>
                             </div>
                             <div>
                                 <p style={{ color: "#fff" }}>Point size: <b>{pointSize}</b></p>
                                 <button style={{ padding: "10px", backgroundColor: "grey", color: "black" }} onClick={() => handlePointSize("decrease")}>-</button>
                                 <button style={{ padding: "10px", backgroundColor: "grey", color: "black" }} onClick={() => handlePointSize("increase")}>+</button>
                             </div>
                             <div>
                                 <p style={{ color: "#fff" }}>Transparency value: <b>{opacity.toFixed(3)}</b></p>
                                 <input value={changeValue} onChange={(e) => setChangeValue(e.target.value)} />
                             </div>
                             <div>
                                 <p style={{ color: "#fff" }}>Zoom: <b>{zoomValue.toFixed(3)}</b></p>
                                 <button style={{ padding: "10px", backgroundColor: "grey", color: "black" }} onClick={() => handleZoom("decrease")}>-</button>
                                 <button style={{ padding: "10px", backgroundColor: "grey", color: "black" }} onClick={() => handleZoom("increase")}>+</button>
                             </div>
                             <div>
                                 <input type="checkbox" value={simpleProportion} onClick={event => {setSimpleProportion(event.target.checked)}}/>
                                 <p style={{ color: "#fff" }}>Use simple proportion?</p>
                             </div>
                         </div>
                     </div>
                     :   null
                 }
                 <Canvas
                     linear
                     resize={{ scroll: false }}
                     orthographic
                     frameloop="demand"
                 >
                     <OrbitControls
                         minDistance={300}
                         enablePan={false}
                         mouseButtons={{
                             LEFT: THREE.MOUSE.ROTATE,
                             MIDDLE: THREE.MOUSE.DOLLY,
                             RIGHT: THREE.MOUSE.ROTATE
                         }}
                     />
                     <Suspense fallback={null}>
                         <group ref={group}>
                             <Portrait
                                 object={testPortrait}
                                 rotation={objectRotation}
                             />
                             <Shape rotation={shapeRotation}/>
                         </group>
                     </Suspense>
                 </Canvas>
             </>
             : <div style={{
                    display: "flex",
                    justifyContent: "center",
                    alignItems: "center",
                    height: "100%"
                }}>
                 {
                     showProcessing && !testPortrait
                     ? <p className="processing">Processing</p>
                     : <ProgressBar
                         radius={100}
                         progress={progress}
                         strokeWidth={18}
                         strokeColor="#5d9cec"
                         strokeLinecap="square"
                         trackStrokeWidth={18}
                     >
                         <div className="indicator">
                             <div>{progress}%</div>
                         </div>
                     </ProgressBar>
                 }
             </div>
            }
        </div>
    );
}

export default PreviewModule;
