import React from 'react';
import Calendar from '../components/Calendar';
import { CalendarProvider } from '../contexts/CalendarContext';
import styles from './CalendarPage.module.scss';

/**
 * 日历页面组件
 */
const CalendarPage: React.FC = () => {
  return (
    <div className={styles.calendarPage}>
      <header className={styles.header}>
        <h1 className={styles.title}>日历</h1>
      </header>
      
      <main className={styles.main}>
        <CalendarProvider>
          <Calendar
            showImageGallery={true}
            autoPlay={true}
            autoPlayInterval={3000}
            hoverEffect="zoom"
          />
        </CalendarProvider>
      </main>
      
      <footer className={styles.footer}>
        <p>&copy; {new Date().getFullYear()} 日历组件</p>
      </footer>
    </div>
  );
};

export default CalendarPage; 