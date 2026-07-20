function Header() {
  return (
    <header
      style={{
        height: "70px",
        backgroundColor: "#ffffff",
        borderBottom: "1px solid #ddd",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        padding: "0 30px",
      }}
    >
      <h3>Sistema de Gestión Académica</h3>

      <span>Director del Programa</span>
    </header>
  );
}

export default Header;