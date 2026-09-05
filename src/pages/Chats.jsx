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
      padding: '16px 12px 120px',
      maxWidth: '850px',
      margin: '0 auto'
    }}>
      {/* Direct Chat Main Container */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <UserDirectChat isOwnProfile={true} initialChatWithUid={withUid} />
      </motion.div>
    </div>
  );
}
