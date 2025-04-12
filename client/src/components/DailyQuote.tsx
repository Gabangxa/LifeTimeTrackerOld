import { useEffect, useState } from 'react';

interface Quote {
  text: string;
  author: string;
  category: string;
  source: string;
}

interface QuotesData {
  quotes: Quote[];
}

export function DailyQuote() {
  const [quote, setQuote] = useState<Quote | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchQuote = async () => {
      try {
        const response = await fetch('/quotes.json');
        const data: QuotesData = await response.json();
        
        if (data.quotes && data.quotes.length > 0) {
          const today = new Date();
          const index = today.getDate() % data.quotes.length; // Index will cycle by day
          setQuote(data.quotes[index]);
        }
      } catch (error) {
        console.error('Error loading quotes:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchQuote();
  }, []);

  if (loading) {
    return <div className="animate-pulse h-12 bg-gray-200 dark:bg-gray-700 rounded my-2"></div>;
  }

  if (!quote) {
    return null;
  }

  return (
    <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4 my-4 border border-gray-200 dark:border-gray-700">
      <blockquote className="text-gray-700 dark:text-gray-300 italic">
        <span className="text-xl font-serif">"</span>
        <span id="daily-quote">{quote.text}</span>
        <span className="text-xl font-serif">"</span>
      </blockquote>
      <div className="mt-2 text-right">
        <span id="quote-author" className="text-gray-500 dark:text-gray-400">
          — {quote.author}
        </span>
      </div>
    </div>
  );
}