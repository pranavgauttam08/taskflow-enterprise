import { useState, useRef, useEffect, useMemo } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import * as THREE from 'three';

/* ---- 3D Floating Particles Background ---- */
function Particles({ count = 80 }) {
  const mesh = useRef();
  const positions = useMemo(() => {
    const pos = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) {
      pos[i * 3] = (Math.random() - 0.5) * 20;
      pos[i * 3 + 1] = (Math.random() - 0.5) * 20;
      pos[i * 3 + 2] = (Math.random() - 0.5) * 20;
    }
    return pos;
  }, [count]);

  useFrame((state) => {
    if (mesh.current) {
      mesh.current.rotation.y = state.clock.elapsedTime * 0.03;
      mesh.current.rotation.x = Math.sin(state.clock.elapsedTime * 0.02) * 0.1;
    }
  });

  return (
    <points ref={mesh}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" count={count} array={positions} itemSize={3} />
      </bufferGeometry>
      <pointsMaterial size={0.06} color="#5C4AE4" transparent opacity={0.6} sizeAttenuation />
    </points>
  );
}

function FloatingShape({ position, color, speed }) {
  const mesh = useRef();
  useFrame((state) => {
    if (mesh.current) {
      mesh.current.rotation.x = state.clock.elapsedTime * speed * 0.5;
      mesh.current.rotation.y = state.clock.elapsedTime * speed * 0.3;
      mesh.current.position.y = position[1] + Math.sin(state.clock.elapsedTime * speed) * 0.5;
    }
  });
  return (
    <mesh ref={mesh} position={position}>
      <octahedronGeometry args={[0.4, 0]} />
      <meshStandardMaterial color={color} transparent opacity={0.3} wireframe />
    </mesh>
  );
}

function Scene() {
  const knotRef = useRef();
  
  useFrame((state) => {
    if (knotRef.current) {
      knotRef.current.rotation.x = state.clock.elapsedTime * 0.2;
      knotRef.current.rotation.y = state.clock.elapsedTime * 0.3;
      knotRef.current.position.y = Math.sin(state.clock.elapsedTime * 0.5) * 0.5;
    }
  });

  return (
    <>
      <ambientLight intensity={0.4} />
      <directionalLight position={[5, 10, 5]} intensity={1.5} />
      <pointLight position={[-5, -5, 5]} intensity={0.8} color="#FDCB6E" />
      <pointLight position={[5, -5, -5]} intensity={0.8} color="#6C5CE7" />
      <Particles />
      
      {/* Central 3D Animated Object */}
      <mesh ref={knotRef} position={[0, 0, -2]}>
        <torusKnotGeometry args={[4.2, 1.0, 150, 40]} />
        <meshStandardMaterial 
          color="#0d1226" 
          metalness={0.9} 
          roughness={0.05}
          envMapIntensity={1.5}
          wireframe={false}
        />
        {/* Glowing inner wireframe effect */}
        <mesh>
          <torusKnotGeometry args={[4.2, 1.02, 150, 40]} />
          <meshBasicMaterial color="#6C5CE7" wireframe transparent opacity={0.15} />
        </mesh>
      </mesh>

      {/* Background Floating Accents */}
      <FloatingShape position={[4, 2, -5]} color="#6C5CE7" speed={0.4} />
      <FloatingShape position={[-3, -3, -6]} color="#A29BFE" speed={0.3} />
      <FloatingShape position={[5, -2, -4]} color="#FDCB6E" speed={0.2} />
    </>
  );
}

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const user = await login(email, password);
      navigate(user.role === 'ADMIN' ? '/admin' : '/dashboard');
    } catch (err) {
      setError(err.response?.data?.error || 'Login failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-page">
      <div className="login-left">
        <div className="login-brand">
          <div className="logo-icon">TF</div>
          <h2>TaskFlow Enterprise</h2>
        </div>
        
        <div className="login-3d-container">
          <Canvas camera={{ position: [0, 0, 8], fov: 60 }} gl={{ alpha: true }} style={{ background: 'transparent' }}>
            <Scene />
          </Canvas>
        </div>

        <div className="login-tagline">
          <h1>Manage Work.<br /><span className="text-gradient">Beautifully.</span></h1>
          <p>Enterprise-grade task management powered by real-time analytics and stunning visual design.</p>
        </div>
      </div>

      <div className="login-right">
        <motion.div
          className="login-card"
          initial={{ opacity: 0, x: 30 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.6, ease: [0.34, 1.56, 0.64, 1], delay: 0.2 }}
        >
          <div className="login-logo">
            <h1>Welcome Back</h1>
            <p>Sign in to your account to continue</p>
          </div>

          <form className="login-form" onSubmit={handleSubmit}>
            <AnimatePresence>
              {error && (
                <motion.div
                  className="login-error"
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                >
                  {error}
                </motion.div>
              )}
            </AnimatePresence>

            <div className="input-group">
              <label htmlFor="email">Company Email</label>
              <input
                id="email"
                type="email"
                className="input"
                placeholder="you@taskflow.io"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                autoFocus
              />
            </div>

            <div className="input-group">
              <label htmlFor="password">Password</label>
              <input
                id="password"
                type="password"
                className="input"
                placeholder="Enter your password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>

            <motion.button
              type="submit"
              className="btn btn-primary login-btn"
              disabled={loading}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              {loading ? (
                <span style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', justifyContent: 'center' }}>
                  <span style={{
                    width: 18, height: 18, border: '2px solid rgba(3,5,16,0.3)',
                    borderTopColor: '#030510', borderRadius: '50%',
                    animation: 'spin 0.8s linear infinite', display: 'inline-block',
                  }} />
                  Signing In...
                </span>
              ) : 'Sign In'}
            </motion.button>
          </form>

          <p style={{ textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.75rem', marginTop: '2.5rem', opacity: 0.8 }}>
            TaskFlow Enterprise v2.0 — Secure Access
          </p>
        </motion.div>
      </div>

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}
