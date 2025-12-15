// --- START OF FILE App.tsx ---

import React, { useEffect, useState } from 'react';
import WikiHighlighter from './WikiHighlighter';
// FIX: Changed to 'import type' for type-only imports
import type { VideoItem, YouTubeResponse } from './types'; 

// --- CONFIGURATION ---
// IMPORTANT: REPLACE THIS WITH YOUR ACTUAL YOUTUBE API KEY
const YOUTUBE_API_KEY = 'AIzaSyDo0Gnfz3j9dw1RsExJ2irqbzGLlBpoJfw'; 
const VIDEO_COUNT = 3;

// ----- GEMINI API CONFIGURATION -----
// Note: This key is used directly in the fetch call.
const GEMINI_API_KEY = 'AIzaSyDZQKYiE8bo0vyXneT2rGOVSmoqMUBdU_M'; 
const GEMINI_API_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=' + GEMINI_API_KEY;
// ---------------------

interface Video {
  id: string;
  title: string;
}

const App: React.FC = () => {
  // State for Videos
  const [videos, setVideos] = useState<Video[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // State for AI Summary
  const [summary, setSummary] = useState<string | null>(null);
  const [summaryLoading, setSummaryLoading] = useState<boolean>(true);
  const [summaryError, setSummaryError] = useState<string | null>(null);

  // --- HELPER FUNCTION: EXTRACT WIKIPEDIA CONTENT ---
  const getWikiContent = (): string => {
    const contentBody = document.getElementById('bodyContent');
    if (!contentBody) return '';

    let content = '';
    const paragraphs = contentBody.querySelectorAll('p, li');
    paragraphs.forEach(p => {
        if (p.textContent && p.textContent.length > 50) {
            content += p.textContent.trim() + '\n\n';
        }
    });
    
    // Limit content size for the AI model (15,000 characters is generous but safe)
    return content.trim().substring(0, 15000); 
  };
  
  // --- HELPER FUNCTION: FETCH AI SUMMARY (Gemini API Call) ---
  const fetchAISummary = async (wikiContent: string) => {
    if (!wikiContent) {
      setSummaryError('No readable Wikipedia content found for summarization.');
      setSummaryLoading(false);
      return;
    }
    
    // REMOVED THE INCORRECT PLACEHOLDER CHECK
    
    try {
        const prompt = `Summarize the following Wikipedia article content in 3-4 concise, easy-to-read bullet points. Use only the provided text:\n\n---\n\n${wikiContent}`;

        const response = await fetch(GEMINI_API_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                contents: [
                    { role: 'user', parts: [{ text: prompt }] }
                ],
                // FIX: Changed 'config' to 'generationConfig' to resolve the 400 error.
                generationConfig: { 
                    // Adjust temperature for less creative, more factual response
                    temperature: 0.2, 
                }
            }),
        });

        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`AI API Failed: ${response.status} - ${errorText.substring(0, 100)}...`);
        }

        const data = await response.json();
        
        // Extract the summary text from the Gemini response structure
        if (data.candidates && data.candidates.length > 0) {
            const summaryText = data.candidates[0].content.parts[0].text;
            setSummary(summaryText);
        } else {
            // Check for potential error message in the response body if no candidates exist
            const errorMessage = data.error?.message || "AI returned an empty or invalid response.";
            setSummaryError(errorMessage);
        }
        
    } catch (err) {
      setError(null); // Clear video error if it exists
      setSummaryError(err instanceof Error ? err.message : 'Unknown error during AI summarization');
    } finally {
      setSummaryLoading(false);
    }
  };


  // --- EFFECT: FETCH VIDEOS ---
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
        
        // Use YOUTUBE_API_KEY
        const response = await fetch(`https://www.googleapis.com/youtube/v3/search?part=snippet&q=${query}&key=${YOUTUBE_API_KEY}&maxResults=${VIDEO_COUNT}&type=video`);

        if (!response.ok) {
          throw new Error('Failed to fetch videos. Check API Key quota.');
        }

        const data: YouTubeResponse = await response.json();
        
        const fetchedVideos = data.items.map((item: VideoItem) => ({
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

  // --- EFFECT: FETCH AI SUMMARY ---
  useEffect(() => {
    setSummaryLoading(true);
    const wikiContent = getWikiContent();
    setTimeout(() => fetchAISummary(wikiContent), 100);
  }, []);


  // --- RENDER ---
  return (
    <div style={styles.container}>
      {/* 1. Inject the Highlighter. */}
      <WikiHighlighter />

      {/* 2. Existing Video UI */}
      {loading && <div>Loading related videos...</div>}
      
      {error && <div style={{ color: 'red' }}>Video Error: {error}</div>}
      
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

      {/* 3. AI Summary Section - Placed below videos */}
      <div style={styles.summaryContainer}>
          <h3 style={styles.header}>
            <span role="img" aria-label="robot">🤖</span> AI Summary
          </h3>

          {summaryLoading && <div style={styles.summaryText}>Generating AI summary from the article...</div>}
          {summaryError && <div style={{...styles.summaryText, color: 'red'}}>Summary Error: {summaryError}</div>}
          
          {/* Display summary text, handling line breaks and simple formatting */}
          {summary && (
            <div style={styles.summaryText}>
                {/* Simple mapping to treat each line as a paragraph/list item for readability */}
                {summary.split('\n').map((line, index) => (
                    <p key={index} style={{ margin: '0 0 8px 0', paddingLeft: line.trim().startsWith('*') ? '15px' : '0' }}>
                        {line}
                    </p>
                ))}
            </div>
          )}
      </div>

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
  },
  summaryContainer: {
    paddingTop: '15px',
    marginTop: '20px', 
    borderTop: '1px solid #e0e0e0',
  },
  summaryText: {
    fontSize: '14px',
    lineHeight: '1.6',
  }
};

export default App;
// --- END OF FILE App.tsx ---