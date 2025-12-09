import React, { useEffect, useState } from 'react';
import WikiHighlighter from './WikiHighlighter';

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
        const pageTitle = document.querySelector('h1#firstHeading')?.textContent;
        
        if (!pageTitle) {
          setError('Could not identify page title.');
          setLoading(false);
          return;
        }

        const query = encodeURIComponent(`${pageTitle} documentary or summary`);
        
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

  return (
    <div style={styles.container}>
      {/* 1. Inject the Highlighter. It renders invisible logic + a Portal button */}
      <WikiHighlighter />

      {/* 2. Existing Video UI */}
      {loading && <div>Loading related videos...</div>}
      
      {error && <div>Error: {error}</div>}
      
      {!loading && !error && videos.length > 0 && (
        <>
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
        </>
      )}
    </div>
  );
};

const styles: { [key: string]: React.CSSProperties } = {
  container: {
    backgroundColor: '#f8f9fa',
    border: '1px solid #a2a9b1',
    borderRadius: '8px',
    padding: '15px',
    marginBottom: '20px',
    fontFamily: 'sans-serif',
    position: 'relative'
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
    gridTemplateColumns: 'repeat(3, 1fr)',
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