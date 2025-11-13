export type AppStackParamList = {
  Login: { onLogin: (role: string) => void };
  AdminDashboard: { onLogout: () => void };
  ProfesorDashboard: { onLogout: () => void };
};

export type AdminDrawerParamList = {
  GestionCursos: undefined;
  GestionUsuarios: undefined;
  GestionIndumentaria: undefined;
  ListadoGeneral: undefined;
  Reportes: undefined;
};

export type ProfesorDrawerParamList = {
  ProfesorDrawerDashboard: undefined;
  ModificarTaller: undefined;
  ListadoAlumnos: undefined;
  ListadoClases: undefined;
  Asistencia: undefined;
  Planificacion: undefined;
  AsignarIndumentaria: undefined;
};

