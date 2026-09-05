import React from 'react';
import { UserDirectChat } from '../components/UserDirectChat';
import { motion } from 'framer-motion';
import { MessageSquare, ArrowLeft } from 'lucide-react';
import { Link, useSearchParams } from 'react-router-dom';

export function Chats() {
  const [searchParams] = useSearchParams();
  const withUid = searchParams.get('with');

  return (
    <div style={{
      minHeight: '100vh',
      padding: '24px 16px 120px',
      maxWidth: '850px',
      margin: '0 auto'
    }}>
      {/* Header Banner */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        style={{
          marginBottom: '20px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '12px'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <Link
            to="/"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: '40px',
              height: '40px',
              borderRadius: '14px',
              background: 'var(--card-bg)',
              border: '1px solid var(--card-border)',
              color: 'var(--text-main)',
              textDecoration: 'none'
            }}
            title="Volver a Inicio"
          >
            <ArrowLeft size={20} />
          </Link>
          <div>
            <h1 style={{
              margin: 0,
              fontSize: '1.6rem',
              fontWeight: 900,
              color: 'var(--text-main)',
              display: 'flex',
              alignItems: 'center',
              gap: '10px'
            }}>
              <div style={{
                width: '36px',
                height: '36px',
                borderRadius: '12px',
                background: 'linear-gradient(135deg, #059669, #10B981)',
                color: '#fff',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}>
                <MessageSquare size={20} />
              </div>
              Mensajes Directos
            </h1>
            <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
              Centro de mensajería privada 100% interna entre estudiantes RUMBO
            </span>
          </div>
        </div>
      </motion.div>

      {/* Direct Chat Main Container */}
      <motion.div
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
      >
        <UserDirectChat isOwnProfile={true} initialChatWithUid={withUid} />
      </motion.div>
    </div>
  );
}
