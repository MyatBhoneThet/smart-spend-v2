# Smart Spend

## Installation

1. Clone the repository:
```
git clone https://github.com/MyatBhoneThet/senior-project-backend.git
```
2. Install dependencies:
```
cd backend
npm install
```
3. Create a `.env` file in the root directory and add the following environment variables:
```
VITE_API_BASE_URL=http://localhost:8000
VITE_GOOGLE_CLIENT_ID=your-google-client-id
```

## Usage

1. Start the development server:
```
npm run dev
```
2. Open your browser and navigate to `http://localhost:3000`.

## API

The application uses the following API endpoints:

- `POST /api/v1/auth/login`: Login user
- `POST /api/v1/auth/register`: Register user
- `GET /api/v1/auth/me`: Get user information
- `POST /api/v1/expense/add`: Add new expense
- `GET /api/v1/expense/get`: Get all expenses
- `PUT /api/v1/expense/:id`: Update an expense
- `DELETE /api/v1/expense/:id`: Delete an expense
- `POST /api/v1/income/add`: Add new income
- `GET /api/v1/income/get`: Get all incomes
- `PUT /api/v1/income/:id`: Update an income
- `DELETE /api/v1/income/:id`: Delete an income
- `GET /api/v1/dashboard`: Get dashboard data
- `GET /api/v1/categories`: Get categories
- `POST /api/v1/categories`: Create a new category
- `POST /api/v1/chat/send`: Send a message to the chat

## Contributing

1. Fork the repository
2. Create a new branch: `git checkout -b feature/your-feature`
3. Make your changes and commit them: `git commit -am 'Add some feature'`
4. Push to the branch: `git push origin feature/your-feature`
5. Submit a pull request

## License

This project is licensed under the [MIT License](LICENSE).

## Testing

To run the tests, use the following command:
```
npm test
```

The project uses Jest and React Testing Library for unit and integration testing.
