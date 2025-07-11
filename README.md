# Loverary - Library Management System

Loverary is a modern web-based library system that provides an intuitive interface for both library administrators and patrons. The application is built using modern web technologies including HTML5, CSS3, JavaScript, and utilizes Tailwind CSS for styling.

## Features

### User Features
- User authentication (login/signup)
- Browse available books
- View book details
- Loan management
- User profile management
- Checkout process

### Admin Features
- Dashboard with statistics
- Book management (CRUD operations)
- User management
- Loan management
- Admin authentication

## Project Structure

```
loverary-UI/
├── public/             # Static assets
├── src/
│   ├── api/            # API integration
│   │   ├── auth.js     # Authentication API
│   │   ├── books.js    # Books API
│   │   ├── loans.js    # Loans API
│   │   └── index.js    # API utilities
│   ├── components/     # Reusable components
│   │   └── AdminSidebar.js
│   ├── js/             # JavaScript modules
│   │   ├── admin-books.js
│   │   ├── admin-books-new.js
│   │   └── adminDashboard.js
│   ├── utils/          # Utility functions
│   │   ├── auth.js
│   │   ├── authState.js
│   │   ├── nav.js
│   │   └── toast.js
│   ├── index.js        # Main JavaScript entry
│   └── style.css       # Global styles
├── admin-book-create.html
├── admin-book-edit.html
├── admin-books.html
├── admin-dashboard.html
├── admin-login.html
├── admin-loans.html
├── admin-users.html
├── book-form.html
├── browse.html
├── checkout.html
├── index.html
├── loans.html
├── login.html
└── signup.html
```

## Technologies Used

- **Frontend**:
  - HTML5
  - CSS3 (with Tailwind CSS)
  - JavaScript (ES6+)
  - Vite (Build Tool)
  - PostCSS (CSS Processing)

- **Development Tools**:
  - Node.js
  - npm (Node Package Manager)
  - ESLint (Code Linting)
  - Prettier (Code Formatting)

## Getting Started

### Prerequisites

- Node.js (v14 or later)
- npm (v6 or later)

### Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/your-username/loverary-UI.git
   cd loverary-UI
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Start the development server:
   ```bash
   npm run dev
   ```

4. Open your browser and navigate to `http://localhost:5173`

## Available Scripts

- `npm run dev` - Start the development server
- `npm run build` - Build for production
- `npm run preview` - Preview the production build
- `npm run lint` - Run ESLint
- `npm run format` - Format code with Prettier

## Project Configuration

The project uses the following configuration files:

- `vite.config.js` - Vite configuration
- `tailwind.config.js` - Tailwind CSS configuration
- `postcss.config.js` - PostCSS configuration
- `package.json` - Project metadata and dependencies

## Contributing

1. Fork the repository
2. Create a new branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## License

This project is licensed under the BITS License.

## Acknowledgements

- [Tailwind CSS](https://tailwindcss.com/)
- [Vite](https://vitejs.dev/)
- [PostCSS](https://postcss.org/)
- [ESLint](https://eslint.org/)
- [Prettier](https://prettier.io/)
