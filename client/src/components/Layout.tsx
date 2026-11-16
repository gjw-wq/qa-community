import { Link, Outlet, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function Layout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate("/");
  };

  return (
    <div className="min-h-screen">
      <header className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-5xl mx-auto px-4 h-14 flex items-center justify-between">
          <Link to="/" className="text-lg font-bold text-blue-600 hover:text-blue-700">
            问答社区
          </Link>
          <div className="flex items-center gap-3">
            <Link
              to="/ask"
              className="bg-blue-600 text-white px-3 py-1.5 rounded-md text-sm hover:bg-blue-700 transition-colors"
            >
              提问
            </Link>
            {user ? (
              <>
                <Link
                  to={`/user/${user.id}`}
                  className="text-sm text-gray-700 hover:text-blue-600 font-medium"
                >
                  {user.username}
                </Link>
                <span className="text-xs text-amber-600 bg-amber-50 px-2 py-0.5 rounded">
                  积分 {user.points}
                </span>
                <button
                  type="button"
                  onClick={handleLogout}
                  className="text-sm text-gray-500 hover:text-red-500 transition-colors"
                >
                  退出
                </button>
              </>
            ) : (
              <>
                <Link to="/login" className="text-sm text-gray-600 hover:text-blue-600">
                  登录
                </Link>
                <Link
                  to="/register"
                  className="text-sm text-blue-600 border border-blue-600 px-3 py-1 rounded-md hover:bg-blue-50 transition-colors"
                >
                  注册
                </Link>
              </>
            )}
          </div>
        </div>
      </header>
      <main className="max-w-5xl mx-auto px-4 py-6">
        <Outlet />
      </main>
    </div>
  );
}
