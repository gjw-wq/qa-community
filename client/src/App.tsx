import { Route, Routes } from "react-router-dom";
import Layout from "./components/Layout";
import ProtectedRoute from "./components/ProtectedRoute";
import Ask from "./pages/Ask";
import Home from "./pages/Home";
import Login from "./pages/Login";
import QuestionDetail from "./pages/QuestionDetail";
import Register from "./pages/Register";
import UserProfile from "./pages/UserProfile";

export default function App() {
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route path="/" element={<Home />} />
        <Route path="/question/:id" element={<QuestionDetail />} />
        <Route
          path="/ask"
          element={
            <ProtectedRoute>
              <Ask />
            </ProtectedRoute>
          }
        />
        <Route path="/user/:id" element={<UserProfile />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route
          path="*"
          element={<div className="py-20 text-center text-gray-500">页面不存在</div>}
        />
      </Route>
    </Routes>
  );
}
