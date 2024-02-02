# Fashion Outfit Generator Web App

![Fashion Outfit Generator](https://github.com/AmitParekh1771/imagine-outfit/assets/86157892/4e92db04-8026-4758-bdb7-7da504fc2971)


Welcome to the Fashion Outfit Generator web app! This project was developed as a submission for the Flipkart GRID 5.0 competition. The app utilizes advanced technologies to recommend the perfect fashion outfit based on user preferences, purchase history, and current trends.

## Features

- **Smart Recommendations:** Our app leverages OpenAI's API to perform prompt engineering and generate tailored outfit recommendations.
- **Data Scraping:** We utilize the Cheerio library in NodeJS to scrape relevant fashion data from the Flipkart website.
- **Web Server:** The app is powered by the Express library, creating a robust web server to handle user interactions.
- **Customization:** Users can not only generate outfits but also fine-tune them by providing specific prompts.
- **History Management:** Keep track of your outfit history and revisit your favorite styles.

## Installation and Usage

1. Clone this repository to your local machine.
2. Create a `.env` file in the root folder with your OpenAI API key: `OPENAI_API_KEY=<YOUR_API_KEY>`.
3. Ensure you have NodeJS version `^18.15.0` installed.
4. Install project dependencies: `npm install`.
5. To run the app in development mode: `npm run dev`.
6. To run the app in production mode: `npm start`.
7. Visit `https://localhost:3000` in your browser to experience the app locally.

## Deployment

The app is deployed using [render.com](https://render.com). You can access the live version at [https://imagine-outfit.onrender.com](https://imagine-outfit.onrender.com).
Note: The live version isn't working as of Dec 31, 2023, due to the expiry of the OpenAI API key.

## Collaboration

Feel free to reach out for collaboration or any questions related to the project. You can contact us at parekhamit04@gmail.com.

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---

We hope you enjoy using the Fashion Outfit Generator web app! Please provide feedback and suggestions for further improvement. Happy coding!
