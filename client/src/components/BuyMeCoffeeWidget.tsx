import React, { useEffect } from 'react';

interface BuyMeCoffeeWidgetProps {
  id: string;
  description?: string;
  message?: string;
  color?: string;
  position?: 'Left' | 'Right';
  x_margin?: number;
  y_margin?: number;
}

export function BuyMeCoffeeWidget({
  id,
  description = "Support me on Buy me a coffee!",
  message = "",
  color = "#FF5F5F",
  position = "Right",
  x_margin = 18,
  y_margin = 18
}: BuyMeCoffeeWidgetProps) {
  useEffect(() => {
    // Create script element
    const script = document.createElement('script');
    script.setAttribute('data-name', 'BMC-Widget');
    script.setAttribute('data-cfasync', 'false');
    script.src = 'https://cdnjs.buymeacoffee.com/1.0.0/widget.prod.min.js';
    script.setAttribute('data-id', id);
    script.setAttribute('data-description', description);
    script.setAttribute('data-message', message);
    script.setAttribute('data-color', color);
    script.setAttribute('data-position', position);
    script.setAttribute('data-x_margin', x_margin.toString());
    script.setAttribute('data-y_margin', y_margin.toString());
    
    // Append to document body
    document.body.appendChild(script);
    
    // Cleanup function to remove script when component unmounts
    return () => {
      document.body.removeChild(script);
      
      // Additionally, find and remove the widget if it exists
      const widgetIframe = document.querySelector('iframe[title="Buy Me A Coffee Widget"]');
      if (widgetIframe && widgetIframe.parentNode) {
        widgetIframe.parentNode.removeChild(widgetIframe);
      }
    };
  }, [id, description, message, color, position, x_margin, y_margin]);
  
  // The component doesn't render anything itself, it just adds the script
  return null;
}