# Lifetime Visualizer

A comprehensive web application that helps users visualize how they spend their lifetime across different activities, providing meaningful insights and real-time projections to optimize time allocation patterns.

![Lifetime Visualizer](attached_assets/image_1743362330850.png)

## Features

- **Personalized Time Analysis**: Input your birthdate, country, and daily activities to see how your time is distributed
- **Life Expectancy Integration**: Automatically fetches life expectancy data based on your country from the World Bank API
- **Interactive Visualizations**: View your life in weeks and see how your time is allocated with dynamic charts
- **Enhanced Activity Comparisons**: Each activity shows 3 unique, meaningful comparisons for better context
- **Dynamic Timeline Projections**: Adjust the timeline slider to see real-time updates to all visualizations
- **Real-time Chart Updates**: All charts and statistics update dynamically as you explore different future ages
- **Optimized Color Scheme**: Activities use distinct colors like Red (#D6293B) and Orange (#F7893B) to enhance visual clarity
- **Health Optimization Suggestions**: Receive personalized recommendations for time reallocation for better health outcomes
- **Exercise Focus**: Prioritization of exercise over commute in the default activities list for health-oriented insights
- **Dark Mode by Default**: Enjoy a comfortable viewing experience with the default dark mode theme
- **Responsive Design**: Works seamlessly on mobile, tablet, and desktop devices

## Technologies Used

- **Frontend**: React, TypeScript, TailwindCSS, shadcn/ui
- **Backend**: Express, Node.js
- **Data Visualization**: Chart.js with real-time updates
- **Data Processing**: Custom algorithms for time calculations and projections
- **API Integration**: World Bank API for country and life expectancy data with robust error handling

## Getting Started

### Prerequisites

- Node.js (v16 or higher)
- npm or yarn

### Installation

1. Clone the repository
2. Install dependencies:
   ```
   npm install
   ```
3. Start the development server:
   ```
   npm run dev
   ```
4. Open your browser and navigate to `http://localhost:5000`

## Usage

1. Enter your birthdate
2. Select your country (or manually enter life expectancy)
3. Add your daily activities with estimated hours spent
4. Click "Visualize My Life" to see the results
5. Use the timeline slider to dynamically explore different future ages
6. Watch how all charts and statistics update in real-time
7. Get personalized health optimization recommendations

![Activity Analysis](attached_assets/image_1743362728800.png)

## Key Concepts

### Life in Weeks

The application visualizes your entire life in weeks, showing:
- Weeks you've already lived
- Weeks remaining based on life expectancy
- A grid visualization representing your entire lifespan
- Dynamic updates as you explore different future ages

### Activity Distribution

See how much of your life you've spent on different activities:
- Percentage of waking hours devoted to each activity
- Years spent on each activity
- Enhanced comparisons with 3 unique, meaningful contexts for each activity
- Real-time updates to all statistics as you move through your timeline

### Dynamic Timeline Projections

The application provides interactive future time allocation projections:
- Move the timeline slider to see how your time distribution changes at different ages
- All charts and statistics update instantly as you move the slider
- Both pie chart (activity distribution) and bar chart (future projections) update dynamically
- Personalized recommendations for health optimization through exercise adjustments

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Production Deployment

The Lifetime Visualizer is deployed and available at:

**[lifetimeviz.com](https://lifetimeviz.com)**

## Acknowledgments

- World Bank API for providing life expectancy data
- shadcn/ui for the beautiful, accessible UI components
- Chart.js for the interactive, real-time data visualizations
- React and TypeScript for building a robust, type-safe application
- The research on time allocation and life expectancy that informed our optimization algorithms