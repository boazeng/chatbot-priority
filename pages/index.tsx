import React from 'react';
import type { NextPage } from 'next';
import Head from 'next/head';
import ChatBot from '../components/ChatBot';

const Home: NextPage = () => {
  return (
    <div className="min-h-screen bg-gray-100">
      <Head>
        <title>צ'אטבוט מערכת חניה רובוטית</title>
        <meta name="description" content="צ'אטבוט לתמיכה במערכת חניה רובוטית" />
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <main className="min-h-screen">
        <ChatBot />
      </main>
    </div>
  );
};

export default Home; 