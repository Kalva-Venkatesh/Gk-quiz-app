import React from 'react';
import './output.css';
// Main App Component
export default function App() {
    // --- STATE MANAGEMENT ---
    const [gameState, setGameState] = React.useState('start'); // 'start', 'active', 'finished'
    const [questions, setQuestions] = React.useState([]);
    const [currentQuestionIndex, setCurrentQuestionIndex] = React.useState(0);
    const [score, setScore] = React.useState(0);
    const [selectedAnswer, setSelectedAnswer] = React.useState(null);
    const [isAnswered, setIsAnswered] = React.useState(false);
    const [loading, setLoading] = React.useState(false);
    const [error, setError] = React.useState(null);

    // --- UTILITY FUNCTIONS ---

    // Decodes HTML entities (e.g., &quot;) from the API response
    const decodeHtml = (html) => {
        const txt = document.createElement("textarea");
        txt.innerHTML = html;
        return txt.value;
    };
    
    // Shuffles an array - used to randomize answer order
    const shuffleArray = (array) => {
        return [...array].sort(() => Math.random() - 0.5);
    };

    // --- API CALL ---

    // Fetches questions from the Open Trivia Database API
    const fetchQuestions = async () => {
        setLoading(true);
        setError(null);
        setGameState('active');
        setSelectedAnswer(null);
        setIsAnswered(false);
        
        try {
            const response = await fetch('https://opentdb.com/api.php?amount=10&category=9&difficulty=easy&type=multiple');
            if (!response.ok) {
                throw new Error('Something went wrong. Could not fetch questions.');
            }
            const data = await response.json();
            if (data.response_code !== 0) {
                 throw new Error('There was an issue with the trivia API. Please try again later.');
            }
            
            // Format questions and shuffle answers
            const formattedQuestions = data.results.map((questionItem) => ({
                ...questionItem,
                question: decodeHtml(questionItem.question),
                correct_answer: decodeHtml(questionItem.correct_answer),
                incorrect_answers: questionItem.incorrect_answers.map(decodeHtml),
                answers: shuffleArray([...questionItem.incorrect_answers.map(decodeHtml), decodeHtml(questionItem.correct_answer)]),
            }));
            
            setQuestions(formattedQuestions);
        } catch (err) {
            setError(err.message);
            setGameState('start'); // Go back to start screen on error
        } finally {
            setLoading(false);
        }
    };
    
    // --- EVENT HANDLERS ---
    
    const handleStartQuiz = () => {
        setScore(0);
        setCurrentQuestionIndex(0);
        fetchQuestions();
    };

    const handleAnswerSelect = (answer) => {
        if (isAnswered) return; // Prevent changing answer

        setSelectedAnswer(answer);
        setIsAnswered(true);
        if (answer === questions[currentQuestionIndex].correct_answer) {
            setScore(prevScore => prevScore + 1);
        }
    };
    
    const handleNextQuestion = () => {
        if (currentQuestionIndex < questions.length - 1) {
            setCurrentQuestionIndex(prevIndex => prevIndex + 1);
            setSelectedAnswer(null);
            setIsAnswered(false);
        } else {
            setGameState('finished');
        }
    };
    
    // --- HELPER FOR DYNAMIC STYLING ---
    
    const getAnswerButtonClass = (answer) => {
        if (!isAnswered) {
            return "bg-indigo-500 hover:bg-indigo-600";
        }
        
        const isCorrect = answer === questions[currentQuestionIndex].correct_answer;
        const isSelected = answer === selectedAnswer;

        if (isCorrect) {
            return "bg-green-500 scale-105"; // Correct answer is always green
        }
        if (isSelected && !isCorrect) {
            return "bg-red-500"; // Selected incorrect answer is red
        }
        return "bg-gray-500 opacity-70"; // Other incorrect answers are grayed out
    };
    
    // --- RENDER LOGIC ---

    const renderContent = () => {
        if (loading) {
            return (
                 <div className="flex flex-col items-center justify-center text-white">
                    <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-white mb-4"></div>
                    <p className="text-xl">Fetching Questions...</p>
                </div>
            );
        }

        if (gameState === 'start') {
            return <StartScreen onStart={handleStartQuiz} error={error} />;
        }
        
        if (gameState === 'finished') {
            return <ResultScreen score={score} total={questions.length} onRestart={handleStartQuiz} />;
        }
        
        if (gameState === 'active' && questions.length > 0) {
            const currentQuestion = questions[currentQuestionIndex];
            return (
                <div className="w-full max-w-lg mx-auto p-4 text-white animate-fade-in">
                    <div className="mb-6 text-center">
                        <p className="text-lg text-indigo-200">Question {currentQuestionIndex + 1} of {questions.length}</p>
                        <h2 className="text-2xl font-bold mt-2 leading-tight">{currentQuestion.question}</h2>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {currentQuestion.answers.map((answer, index) => (
                            <button
                                key={index}
                                onClick={() => handleAnswerSelect(answer)}
                                disabled={isAnswered}
                                className={`w-full p-4 rounded-lg font-semibold text-white shadow-lg transition-all duration-300 transform ${getAnswerButtonClass(answer)} ${isAnswered ? '' : 'hover:scale-105'}`}
                            >
                                {answer}
                            </button>
                        ))}
                    </div>
                    
                    {isAnswered && (
                        <div className="mt-8 text-center animate-fade-in-up">
                            <button 
                                onClick={handleNextQuestion}
                                className="bg-purple-600 hover:bg-purple-700 text-white font-bold py-3 px-8 rounded-full shadow-lg transition-transform transform hover:scale-105"
                            >
                                {currentQuestionIndex < questions.length - 1 ? 'Next Question' : 'Finish Quiz'}
                            </button>
                        </div>
                    )}
                </div>
            );
        }
        
        return null; // Should not happen in normal flow
    };

    return (
        <div className="bg-gray-900 min-h-screen flex flex-col items-center justify-center p-4 font-sans relative overflow-hidden">
            {/* Background decorative elements */}
            <div className="absolute top-0 left-0 w-48 h-48 bg-indigo-800 rounded-full opacity-30 -translate-x-1/2 -translate-y-1/2"></div>
            <div className="absolute bottom-0 right-0 w-64 h-64 bg-purple-800 rounded-full opacity-30 translate-x-1/2 translate-y-1/2"></div>
            
            <div className="bg-gray-800 bg-opacity-50 backdrop-blur-md rounded-2xl shadow-2xl w-full max-w-2xl min-h-[500px] flex flex-col items-center justify-center p-6 border border-gray-700">
                <h1 className="text-4xl md:text-5xl font-extrabold text-white mb-4 tracking-wider">
                    Trivia <span className="text-indigo-400">Challenge</span>
                </h1>
                <div className="w-full text-center">
                    {renderContent()}
                </div>
            </div>
             <footer className="text-gray-500 text-sm mt-6">
                Powered by <a href="https://opentdb.com/" target="_blank" rel="noopener noreferrer" className="text-indigo-400 hover:underline">Open Trivia DB</a>
            </footer>
        </div>
    );
}

// --- SUB-COMPONENTS ---

const StartScreen = ({ onStart, error }) => (
    <div className="text-center text-white animate-fade-in">
        <h2 className="text-2xl font-semibold mb-4">Test Your Knowledge!</h2>
        <p className="text-indigo-200 mb-8 max-w-sm mx-auto">Ready to take on 10 general knowledge questions? Let's see how you do.</p>
        {error && <p className="text-red-400 mb-4">{error}</p>}
        <button
            onClick={onStart}
            className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3 px-10 rounded-full shadow-lg transition-transform transform hover:scale-105"
        >
            Start Quiz
        </button>
    </div>
);

const ResultScreen = ({ score, total, onRestart }) => {
    const percentage = Math.round((score / total) * 100);
    const getResultMessage = () => {
        if (percentage === 100) return "Perfect Score! You're a genius!";
        if (percentage >= 80) return "Great job! You know your stuff.";
        if (percentage >= 50) return "Not bad! A solid effort.";
        return "Keep learning! Better luck next time.";
    };

    return (
        <div className="text-center text-white animate-fade-in">
            <h2 className="text-3xl font-bold mb-2">Quiz Completed!</h2>
            <p className="text-indigo-200 text-lg mb-6">{getResultMessage()}</p>
            <div className="bg-gray-700 rounded-lg p-6 mb-8 inline-block">
                 <p className="text-xl">Your Score:</p>
                 <p className="text-5xl font-bold text-indigo-400">{score} <span className="text-3xl text-white">/ {total}</span></p>
                 <p className="text-2xl font-semibold mt-2">({percentage}%)</p>
            </div>
            <button
                onClick={onRestart}
                className="bg-purple-600 hover:bg-purple-700 text-white font-bold py-3 px-10 rounded-full shadow-lg transition-transform transform hover:scale-105"
            >
                Play Again
            </button>
        </div>
    );
};

