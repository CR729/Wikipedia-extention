import React, { useEffect, useState } from 'react';

// --- CONFIGURATION ---
const API_KEY = 'AIzaSyDo0Gnfz3j9dw1RsExJ2irqbzGLlBpoJfw'; 
const VIDEO_COUNT = 3;
// ---------------------

interface Video {
  id: string;
  title: string;
}

const App: React.FC = () => {
  const [videos, setVideos] = useState<Video[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchVideos = async () => {
      try {
        // 1. Get the article title from the H1 tag of the Wiki page
        const pageTitle = document.querySelector('h1#firstHeading')?.textContent;
        
        if (!pageTitle) {
          setError('Could not identify page title.');
          setLoading(false);
          return;
        }

        const query = encodeURIComponent(`${pageTitle} documentary or summary`);
        
        // 2. Call YouTube API
        const response = await fetch(
          `https://www.googleapis.com/youtube/v3/search?part=snippet&q=${query}&maxResults=${VIDEO_COUNT}&type=video&key=${API_KEY}`
        );

        if (!response.ok) {
          throw new Error('Failed to fetch videos. Check API Key quota.');
        }

        const data = await response.json();
        
        const fetchedVideos = data.items.map((item: any) => ({
          id: item.id.videoId,
          title: item.snippet.title,
        }));

        setVideos(fetchedVideos);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Unknown error');
      } finally {
        setLoading(false);
      }
    };

    fetchVideos();
  }, []);

  if (loading) return <div style={styles.container}>Loading related videos...</div>;
  if (error) return <div style={styles.container}>Error: {error}</div>;
  if (videos.length === 0) return null;

  return (
    <div style={styles.container}>
      <h3 style={styles.header}>
        <span role="img" aria-label="tv">📺</span> Related Videos
      </h3>
      <div style={styles.grid}>
        {videos.map((video) => (
          <div key={video.id} style={styles.videoWrapper}>
            <iframe
              width="100%"
              height="200"
              src={`https://www.youtube.com/embed/${video.id}`}
              title={video.title}
              frameBorder="0"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
              style={{ borderRadius: '8px' }}
            ></iframe>
            <p style={styles.videoTitle}>{video.title}</p>
          </div>
        ))}
      </div>
    </div>
  );
};

// Simple inline styles to avoid CSS file injection complexity
const styles: { [key: string]: React.CSSProperties } = {
  container: {
    backgroundColor: '#f8f9fa',
    border: '1px solid #a2a9b1',
    borderRadius: '8px',
    padding: '15px',
    marginBottom: '20px',
    fontFamily: 'sans-serif',
  },
  header: {
    marginTop: 0,
    marginBottom: '15px',
    fontSize: '18px',
    borderBottom: '1px solid #ccc',
    paddingBottom: '10px',
  },
  grid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(3, 1fr)', // 3 Columns
    gap: '15px',
  },
  videoWrapper: {
    display: 'flex',
    flexDirection: 'column',
  },
  videoTitle: {
    fontSize: '12px',
    marginTop: '5px',
    fontWeight: 'bold',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    display: '-webkit-box',
    WebkitLineClamp: 2,
    WebkitBoxOrient: 'vertical',
  }
};

export default App;