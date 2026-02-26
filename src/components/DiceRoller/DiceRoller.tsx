"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { Edges } from "@react-three/drei";
import * as THREE from "three";
import styles from "./DiceRoller.module.css";

interface DiceStep {
  label: string;
  sides: number;
  finalValue: number;
  resultText: string;
}

interface DiceRollerProps {
  steps: DiceStep[];
  onComplete: () => void;
}

const ROLL_DURATION = 1000;
const LAND_DURATION = 200; // matches slerp completion (dur * 0.4)
const PAUSE_BETWEEN = 600;

const getFaceNormals = (geometry: THREE.BufferGeometry): THREE.Vector3[] => {
  if (!geometry.getAttribute("normal")) {
    geometry.computeVertexNormals();
  }
  const normalAttr = geometry.getAttribute("normal");
  const seen = new Map<string, THREE.Vector3>();

  for (let i = 0; i < normalAttr.count; i++) {
    const n = new THREE.Vector3(
      normalAttr.getX(i),
      normalAttr.getY(i),
      normalAttr.getZ(i)
    ).normalize();
    const key = `${n.x.toFixed(1)},${n.y.toFixed(1)},${n.z.toFixed(1)}`;
    if (!seen.has(key)) {
      seen.set(key, n);
    }
  }

  return Array.from(seen.values());
};

const alignFlatBottom = (
  baseQuat: THREE.Quaternion,
  geometry: THREE.BufferGeometry
): THREE.Quaternion => {
  const pos = geometry.getAttribute("position");

  // Transform and deduplicate vertices
  const seen = new Set<string>();
  const allVerts: THREE.Vector3[] = [];
  for (let i = 0; i < pos.count; i++) {
    const v = new THREE.Vector3(pos.getX(i), pos.getY(i), pos.getZ(i));
    v.applyQuaternion(baseQuat);
    const key = `${v.x.toFixed(2)},${v.y.toFixed(2)},${v.z.toFixed(2)}`;
    if (!seen.has(key)) {
      seen.add(key);
      allVerts.push(v);
    }
  }

  // Find the front face vertices (max Z = facing camera)
  let maxZ = -Infinity;
  for (const v of allVerts) {
    if (v.z > maxZ) maxZ = v.z;
  }
  const frontVerts = allVerts.filter((v) => Math.abs(v.z - maxZ) < 0.15);

  if (frontVerts.length < 3) return baseQuat;

  // Compute the center of the front face
  const cx =
    frontVerts.reduce((s, v) => s + v.x, 0) / frontVerts.length;
  const cy =
    frontVerts.reduce((s, v) => s + v.y, 0) / frontVerts.length;

  // Find the angle of each front vertex relative to center
  const angles = frontVerts.map((v) => Math.atan2(v.y - cy, v.x - cx));

  // Find the vertex closest to pointing straight down (-π/2)
  const targetAngle = -Math.PI / 2;
  let closestAngle = angles[0];
  let closestDiff = Math.abs(angles[0] - targetAngle);
  for (const a of angles) {
    let diff = Math.abs(a - targetAngle);
    if (diff > Math.PI) diff = 2 * Math.PI - diff;
    if (diff < closestDiff) {
      closestDiff = diff;
      closestAngle = a;
    }
  }

  // If a vertex is near the bottom (within ~20° of straight down),
  // rotate by half the angular spacing to put an edge at the bottom instead
  const n = frontVerts.length;
  const halfSpacing = Math.PI / n;

  if (closestDiff < halfSpacing * 0.8) {
    // Vertex is near bottom — rotate to shift edge to bottom
    // Rotate so the midpoint between two vertices is at -π/2
    const correction = halfSpacing - closestDiff;
    // Determine rotation direction
    let rawDiff = closestAngle - targetAngle;
    if (rawDiff > Math.PI) rawDiff -= 2 * Math.PI;
    if (rawDiff < -Math.PI) rawDiff += 2 * Math.PI;
    const rotAngle = rawDiff > 0 ? correction : -correction;

    return new THREE.Quaternion()
      .setFromAxisAngle(new THREE.Vector3(0, 0, 1), rotAngle)
      .multiply(baseQuat);
  }

  return baseQuat;
};

const Die3D = ({
  sides,
  rolling,
  onLanded,
}: {
  sides: number;
  rolling: boolean;
  onLanded?: () => void;
}) => {
  const groupRef = useRef<THREE.Group>(null);
  const phaseRef = useRef<"rolling" | "landing" | "static">(
    rolling ? "rolling" : "static"
  );
  const landTimeRef = useRef(0);
  const hasCalledLanded = useRef(false);
  const targetQuatRef = useRef(new THREE.Quaternion());

  const { geometry, faceNormals } = useMemo(() => {
    let geo: THREE.BufferGeometry;
    if (sides <= 4) geo = new THREE.TetrahedronGeometry(1.3);
    else if (sides <= 6) geo = new THREE.BoxGeometry(1.4, 1.4, 1.4);
    else geo = new THREE.DodecahedronGeometry(1.2);
    return { geometry: geo, faceNormals: getFaceNormals(geo) };
  }, [sides]);

  useEffect(() => {
    if (rolling) {
      hasCalledLanded.current = false;
      phaseRef.current = "rolling";

      // Pick a random face to land on, aligned flat-bottom
      if (faceNormals.length > 0) {
        const randomFace =
          faceNormals[Math.floor(Math.random() * faceNormals.length)];
        const q = new THREE.Quaternion();
        q.setFromUnitVectors(
          randomFace.clone().normalize(),
          new THREE.Vector3(0, 0, 1)
        );
        targetQuatRef.current = alignFlatBottom(q, geometry);
      }

      const timer = setTimeout(() => {
        phaseRef.current = "landing";
        landTimeRef.current = 0;
      }, ROLL_DURATION);

      return () => clearTimeout(timer);
    } else {
      phaseRef.current = "static";
      // Set a face forward for static dice too
      if (groupRef.current && faceNormals.length > 0) {
        const face = faceNormals[0];
        const q = new THREE.Quaternion();
        q.setFromUnitVectors(
          face.clone().normalize(),
          new THREE.Vector3(0, 0, 1)
        );
        groupRef.current.quaternion.copy(alignFlatBottom(q, geometry));
      }
    }
  }, [rolling, faceNormals, geometry]);

  useFrame((_, delta) => {
    if (!groupRef.current) return;

    if (phaseRef.current === "rolling") {
      groupRef.current.rotation.x += 4.5 * delta;
      groupRef.current.rotation.y += 3.2 * delta;
      groupRef.current.rotation.z += 1.8 * delta;
    } else if (phaseRef.current === "landing") {
      landTimeRef.current += delta;
      const t = landTimeRef.current;
      const dur = 0.5;

      // Slerp toward the target face orientation
      groupRef.current.quaternion.slerp(
        targetQuatRef.current,
        Math.min(1, t / (dur * 0.4))
      );

      // Bounce
      const p = Math.min(1, t / dur);
      let bounceY = 0;
      if (p < 0.4) bounceY = (1 - p / 0.4) * 0.5;
      else if (p < 0.6) bounceY = ((p - 0.4) / 0.2) * 0.12;
      else if (p < 0.8) bounceY = (1 - (p - 0.6) / 0.2) * 0.12;
      groupRef.current.position.y = bounceY;

      if (t >= dur) {
        phaseRef.current = "static";
        groupRef.current.quaternion.copy(targetQuatRef.current);
        groupRef.current.position.y = 0;
        if (onLanded && !hasCalledLanded.current) {
          hasCalledLanded.current = true;
          onLanded();
        }
      }
    }
  });

  return (
    <group ref={groupRef}>
      <mesh geometry={geometry}>
        <meshBasicMaterial color="#555555" />
        <Edges threshold={15} color="#cc5555" lineWidth={1.5} />
      </mesh>
    </group>
  );
};

const RollingNumber = ({
  sides,
  finalValue,
  landed,
  onSettled,
}: {
  sides: number;
  finalValue: number;
  landed: boolean;
  onSettled: () => void;
}) => {
  const [cyclingDisplay, setCyclingDisplay] = useState("?");
  const onSettledRef = useRef(onSettled);

  useEffect(() => {
    onSettledRef.current = onSettled;
  }, [onSettled]);

  // Cycle random numbers while not landed
  useEffect(() => {
    if (landed) return;
    const interval = setInterval(() => {
      setCyclingDisplay(String(Math.floor(Math.random() * sides) + 1));
    }, 70);
    return () => clearInterval(interval);
  }, [sides, landed]);

  // Notify parent after landing
  useEffect(() => {
    if (!landed) return;
    const t = setTimeout(() => onSettledRef.current(), 200);
    return () => clearTimeout(t);
  }, [landed]);

  const display = landed ? String(finalValue) : cyclingDisplay;

  return (
    <span
      className={`${styles.dieNumber} ${landed ? styles.dieNumberSettled : ""}`}
    >
      {display}
    </span>
  );
};

const DieWithNumber = ({
  sides,
  finalValue,
  rolling,
  onLanded,
}: {
  sides: number;
  finalValue: number;
  rolling: boolean;
  onLanded?: () => void;
}) => {
  const [dieLanded, setDieLanded] = useState(!rolling);
  const [prevRolling, setPrevRolling] = useState(rolling);

  if (rolling !== prevRolling) {
    setPrevRolling(rolling);
    if (rolling) {
      setDieLanded(false);
    }
  }

  useEffect(() => {
    if (!rolling) return;
    const timer = setTimeout(() => {
      setDieLanded(true);
    }, ROLL_DURATION + LAND_DURATION);
    return () => clearTimeout(timer);
  }, [rolling]);

  return (
    <div className={styles.dieContainer}>
      <div className={styles.die}>
        <Canvas
          camera={{ position: [0, 0, 4], fov: 40 }}
          style={{ background: "transparent" }}
          gl={{ alpha: true, antialias: true }}
        >
          <Die3D sides={sides} rolling={rolling} />
        </Canvas>
      </div>
      {rolling ? (
        <RollingNumber
          sides={sides}
          finalValue={finalValue}
          landed={dieLanded}
          onSettled={onLanded!}
        />
      ) : (
        <span className={`${styles.dieNumber} ${styles.dieNumberSettled}`}>
          {finalValue}
        </span>
      )}
    </div>
  );
};

const DiceRoller = ({ steps, onComplete }: DiceRollerProps) => {
  const [activeStep, setActiveStep] = useState(0);
  const [completedSteps, setCompletedSteps] = useState<Set<number>>(
    new Set()
  );
  const onCompleteRef = useRef(onComplete);

  useEffect(() => {
    onCompleteRef.current = onComplete;
  }, [onComplete]);

  const handleLanded = (stepIndex: number) => {
    setCompletedSteps((prev) => {
      const next = new Set(prev);
      next.add(stepIndex);
      return next;
    });

    if (stepIndex < steps.length - 1) {
      setTimeout(() => {
        setActiveStep(stepIndex + 1);
      }, PAUSE_BETWEEN);
    } else {
      setTimeout(() => {
        onCompleteRef.current();
      }, PAUSE_BETWEEN + 400);
    }
  };

  return (
    <div className={styles.overlay}>
      <div className={styles.sequence}>
        {steps.map((step, i) => {
          const isVisible = i <= activeStep;
          return (
            <div
              key={i}
              className={`${styles.rollGroup} ${isVisible ? styles.rollGroupVisible : ""}`}
            >
              <span className={styles.rollLabel}>{step.label}</span>
              <DieWithNumber
                sides={step.sides}
                finalValue={step.finalValue}
                rolling={isVisible && i === activeStep && !completedSteps.has(i)}
                onLanded={() => handleLanded(i)}
              />
              <span className={styles.dieType}>D{step.sides}</span>
              <span
                className={`${styles.rollResult} ${completedSteps.has(i) ? styles.rollResultVisible : ""}`}
              >
                {completedSteps.has(i) ? step.resultText : "\u00A0"}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default DiceRoller;

export type { DiceStep };
