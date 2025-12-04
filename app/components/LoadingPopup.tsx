'use client';

import { useEffect, useState } from 'react';
import styles from './LoadingPopup.module.css';

interface LoadingPopupProps {
  progress: number; // 0-100
  statusMessage?: string;
}

export default function LoadingPopup({ progress, statusMessage }: LoadingPopupProps) {
  const [displayProgress, setDisplayProgress] = useState(0);
  const [currentMessage, setCurrentMessage] = useState('Starting analysis...');

  const messages = [
    'Starting analysis...',
    'Fetching cloud data...',
    'Chasing search spiders...',
    'Counting backlinks...',
    'Purring at algorithms...',
    'Detecting keywords...',
    'Measuring visuals...',
    'Generating insights...',
    'Almost done...',
  ];


  useEffect(() => {
    // Smooth progress animation
    const timer = setInterval(() => {
      setDisplayProgress((prev) => {
        if (prev < progress) {
          return Math.min(prev + 1, progress);
        }
        return prev;
      });
    }, 50);

    return () => clearInterval(timer);
  }, [progress]);

  useEffect(() => {
    // Update message based on progress
    const messageIndex = Math.min(
      Math.floor((progress / 100) * messages.length),
      messages.length - 1
    );
    setCurrentMessage(messages[messageIndex] || messages[messages.length - 1]);
  }, [progress]);

  const displayMessage = statusMessage || currentMessage;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div
        className="relative w-full max-w-[500px] h-[600px] rounded-[30px] shadow-2xl overflow-hidden flex flex-col items-center"
        style={{
          background: 'linear-gradient(180deg, #38bdf8 0%, #60a5fa 100%)',
        }}
      >
        {/* Clouds Background */}
        <div className={`${styles.cloud} ${styles.c1}`}></div>
        <div className={`${styles.cloud} ${styles.c2}`}></div>
        <div className={`${styles.cloud} ${styles.c3}`}></div>

        {/* The Cat */}
        <div className={styles.catContainer}>
          <div className={styles.tail}>
            <div className={styles.tailStripe}></div>
            <div className={styles.tailStripe} style={{ left: '25px' }}></div>
            <div className={styles.tailStripe} style={{ left: '40px' }}></div>
          </div>
          <div className={`${styles.paw} ${styles.pawBl}`}></div>
          <div className={`${styles.paw} ${styles.pawBr}`}></div>
          <div className={styles.catBody}>
            <div className={styles.catBelly}></div>
            <div className={`${styles.stripe} ${styles.stripeS1}`}></div>
            <div className={`${styles.stripe} ${styles.stripeS2}`}></div>
            <div className={`${styles.stripe} ${styles.stripeS3}`}></div>
          </div>
          <div className={`${styles.paw} ${styles.pawFl}`}></div>
          <div className={`${styles.paw} ${styles.pawFr}`}></div>
          <div className={styles.catHead}>
            <div className={`${styles.ear} ${styles.earL}`}></div>
            <div className={`${styles.ear} ${styles.earR}`}></div>
            <div className={`${styles.headStripe} ${styles.headStripeHs1}`}></div>
            <div className={`${styles.headStripe} ${styles.headStripeHs2}`}></div>
            <div className={`${styles.headStripe} ${styles.headStripeHs3}`}></div>
            <div className={`${styles.eye} ${styles.eyeL}`}></div>
            <div className={`${styles.eye} ${styles.eyeR}`}></div>
            <div className={styles.nose}></div>
            <div className={`${styles.whisker} ${styles.whiskerWl1}`}></div>
            <div className={`${styles.whisker} ${styles.whiskerWl2}`}></div>
            <div className={`${styles.whisker} ${styles.whiskerWr1}`}></div>
            <div className={`${styles.whisker} ${styles.whiskerWr2}`}></div>
          </div>
        </div>

        {/* Vertical Loader */}
        <div className={styles.loaderWrapper}>
          <div className={styles.cloudIcon}></div>
          <div className={styles.progressTrack}>
            <div
              className={styles.progressBar}
              style={{ height: `${displayProgress}%` }}
            ></div>
          </div>
          <div className={styles.percentCircle}>{Math.floor(displayProgress)}%</div>
        </div>

        {/* Text Status */}
        <div className={styles.textContainer}>
          <h2>Auditing Site...</h2>
          <p>{displayMessage}</p>
        </div>
      </div>
    </div>
  );
}
