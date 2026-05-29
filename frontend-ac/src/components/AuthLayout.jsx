function AuthLayout({ children }) {
  return (
    <div
      style={{
        display: "flex",
        height: "100vh",
        background: "#f4f6fb",
      }}
    >
      {/* LEFT IMAGE */}
      <div
        style={{
          flex: 1,
          backgroundImage: "url('/astro.png')",
          backgroundSize: "cover",
          backgroundPosition: "center",
        }}
      />

      {/* RIGHT CONTENT */}
      <div
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