# Lifetime Visualizer

A comprehensive web application that helps users visualize how they spend their lifetime across different activities, providing meaningful insights into time allocation patterns.

![Lifetime Visualizer](attached_assets/image_1743362330850.png)

## Features

- **Personalized Time Analysis**: Input your birthdate, country, and daily activities to see how your time is distributed
- **Life Expectancy Integration**: Automatically fetches life expectancy data based on your country from the World Bank API
- **Interactive Visualizations**: View your life in weeks and see how your time is allocated with interactive charts
- **Activity Comparisons**: Every activity shows meaningful comparisons for better context
- **Future Projections**: See how your current habits will affect your time allocation in the future
- **Dark Mode**: Enjoy a comfortable viewing experience with the default dark mode theme
- **Responsive Design**: Works seamlessly on mobile, tablet, and desktop devices

## Technologies Used

- **Frontend**: React, TypeScript, TailwindCSS, shadcn/ui
- **Backend**: Express, Node.js
- **Data Visualization**: Chart.js
- **Data Processing**: Custom algorithms for time calculations
- **API Integration**: World Bank API for country and life expectancy data

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
5. Explore the charts, activity comparisons, and insights provided

![Activity Analysis](attached_assets/image_1743362728800.png)

## Key Concepts

### Life in Weeks

The application visualizes your entire life in weeks, showing:
- Weeks you've already lived
- Weeks remaining based on life expectancy
- A grid visualization representing your entire lifespan

### Activity Distribution

See how much of your life you've spent on different activities:
- Percentage of waking hours devoted to each activity
- Years spent on each activity
- Comparative visualizations to provide context

### Future Projections

The application projects your future time allocation based on your current habits:
- Years you'll spend on each activity over your entire life
- Ability to adjust timeline slider to see projections at different ages
- Recommendations for time optimization

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Acknowledgments

- World Bank API for providing life expectancy data
- shadcn/ui for the beautiful, accessible UI components
- Chart.js for the interactive data visualizations