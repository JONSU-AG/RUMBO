const ACADEMY_USERS = [

  {
    academia: "esparta",

    usuarios: [
      {
        username: "esparta",
        password: "esparta"
      },

      {
        username: "alumno01",
        password: "clave001"
      },

      {
        username: "alumno02",
        password: "clave002"
      }
    ]
  },


  {
    academia: "kelsen",

    usuarios: [
      {
        username: "kelsen",
        password: "kelsen"
      },

      {
        username: "alumno03",
        password: "clave003"
      }
    ]
  },


  {
    academia: "briceno",

    usuarios: [
      {
        username: "briceño",
        password: "briceño"
      }
    ]
  }

];


function checkAcademyLogin(
  academyId,
  enteredUsername,
  enteredPassword
) {

  const academy = ACADEMY_USERS.find(
    academy => academy.academia === academyId
  );

  if (!academy) return false;

  return academy.usuarios.some(
    user =>
      user.username === enteredUsername &&
      user.password === enteredPassword
  );
}