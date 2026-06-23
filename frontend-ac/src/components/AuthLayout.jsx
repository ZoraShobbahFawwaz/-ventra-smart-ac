function AuthLayout({ children }) {
  return (
    <div
      className="auth-layout"
      style={{
        display: "flex",
        height: "100vh",
        background: "#f4f6fb",
      }}
    >
      {/* LEFT IMAGE */}
      <div
        className="auth-visual"
        style={{
          flex: 1,
          backgroundImage: "url('/ac.jpeg')",
          backgroundSize: "cover",
          backgroundPosition: "center",
        }}
      />

      {/* RIGHT CONTENT */}
      <div
        className="auth-panel"
        style={{
          flex: 1,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        {children}
      </div>
    </div>
  );
}

export default AuthLayout;
