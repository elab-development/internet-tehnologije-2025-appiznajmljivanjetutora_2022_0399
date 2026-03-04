const openApiSpec = {
  openapi: "3.0.3",
  info: {
    title: "Tutor Booking App API",
    version: "1.0.0",
    description: "API dokumentacija za aplikaciju za iznajmljivanje tutora.",
  },
  servers: [{ url: "/", description: "Current environment" }],
  tags: [
    { name: "Auth" },
    { name: "Me" },
    { name: "Tutors" },
    { name: "Bookings" },
    { name: "Reviews" },
    { name: "Admin" },
    { name: "Verification" },
  ],
  components: {
    securitySchemes: {
      cookieAuth: {
        type: "apiKey",
        in: "cookie",
        name: "auth_token",
      },
    },
    schemas: {
      ErrorResponse: {
        type: "object",
        properties: {
          error: { type: "string" },
        },
      },
      LoginRequest: {
        type: "object",
        required: ["email", "lozinka"],
        properties: {
          email: { type: "string", format: "email" },
          lozinka: { type: "string" },
        },
      },
      RegisterRequest: {
        type: "object",
        required: ["ime", "prezime", "email", "lozinka", "role"],
        properties: {
          ime: { type: "string" },
          prezime: { type: "string" },
          email: { type: "string", format: "email" },
          lozinka: { type: "string" },
          role: { type: "string", enum: ["UCENIK", "TUTOR"] },
        },
      },
      AuthUser: {
        type: "object",
        properties: {
          korisnikId: { type: "integer" },
          role: { type: "string", enum: ["UCENIK", "TUTOR", "ADMIN"] },
          email: { type: "string", format: "email" },
          ime: { type: "string" },
          prezime: { type: "string" },
        },
      },
      CreateTerminRequest: {
        type: "object",
        required: ["datum", "vremeOd", "vremeDo"],
        properties: {
          datum: { type: "string", format: "date-time" },
          vremeOd: { type: "string", example: "10:00:00" },
          vremeDo: { type: "string", example: "11:00:00" },
          status: { type: "string", enum: ["SLOBODAN", "REZERVISAN", "OTKAZAN"] },
        },
      },
      CreateRezervacijaRequest: {
        type: "object",
        required: ["terminId"],
        properties: {
          terminId: { type: "integer" },
        },
      },
      CreateRecenzijaRequest: {
        type: "object",
        required: ["rezervacijaId", "ocena"],
        properties: {
          rezervacijaId: { type: "integer" },
          ocena: { type: "integer", minimum: 1, maximum: 5 },
          komentar: { type: "string" },
        },
      },
    },
  },
  paths: {
    "/api/auth/login": {
      post: {
        tags: ["Auth"],
        summary: "Prijava korisnika",
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/LoginRequest" },
            },
          },
        },
        responses: {
          "200": {
            description: "Uspešna prijava",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/AuthUser" },
              },
            },
          },
          "401": {
            description: "Neispravni kredencijali",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/ErrorResponse" },
              },
            },
          },
        },
      },
    },
    "/api/auth/register": {
      post: {
        tags: ["Auth"],
        summary: "Registracija učenika ili tutora",
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/RegisterRequest" },
            },
          },
        },
        responses: {
          "201": { description: "Korisnik registrovan" },
          "409": { description: "Email već postoji" },
        },
      },
    },
    "/api/auth/logout": {
      post: {
        tags: ["Auth"],
        summary: "Odjava korisnika",
        responses: {
          "200": { description: "Uspešna odjava" },
        },
      },
    },
    "/api/me": {
      get: {
        tags: ["Me"],
        summary: "Podaci o trenutno prijavljenom korisniku",
        responses: {
          "200": { description: "Korisnik ili null" },
        },
      },
    },
    "/api/tutors": {
      get: {
        tags: ["Tutors"],
        summary: "Lista tutora",
        responses: {
          "200": { description: "Lista tutora" },
        },
      },
    },
    "/api/tutors/{id}": {
      get: {
        tags: ["Tutors"],
        summary: "Detalji tutora",
        parameters: [{ name: "id", in: "path", required: true, schema: { type: "integer" } }],
        responses: {
          "200": { description: "Detalji tutora" },
        },
      },
      put: {
        tags: ["Tutors"],
        summary: "Izmena tutor profila",
        security: [{ cookieAuth: [] }],
        parameters: [{ name: "id", in: "path", required: true, schema: { type: "integer" } }],
        responses: {
          "200": { description: "Profil ažuriran" },
          "403": { description: "Nedozvoljeno" },
        },
      },
    },
    "/api/termini": {
      get: {
        tags: ["Bookings"],
        summary: "Lista termina",
        responses: { "200": { description: "Lista termina" } },
      },
      post: {
        tags: ["Bookings"],
        summary: "Kreiranje termina (TUTOR)",
        security: [{ cookieAuth: [] }],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/CreateTerminRequest" },
            },
          },
        },
        responses: {
          "201": { description: "Termin kreiran" },
          "403": { description: "Nedozvoljeno" },
        },
      },
    },
    "/api/rezervacije": {
      post: {
        tags: ["Bookings"],
        summary: "Rezervacija termina (UCENIK)",
        security: [{ cookieAuth: [] }],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/CreateRezervacijaRequest" },
            },
          },
        },
        responses: {
          "201": { description: "Rezervacija kreirana" },
          "400": { description: "Neispravni podaci" },
        },
      },
      get: {
        tags: ["Bookings"],
        summary: "Lista rezervacija",
        security: [{ cookieAuth: [] }],
        responses: { "200": { description: "Lista rezervacija" } },
      },
    },
    "/api/recenzije": {
      post: {
        tags: ["Reviews"],
        summary: "Kreiranje recenzije",
        security: [{ cookieAuth: [] }],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/CreateRecenzijaRequest" },
            },
          },
        },
        responses: {
          "201": { description: "Recenzija kreirana" },
          "403": { description: "Nedozvoljeno" },
        },
      },
      get: {
        tags: ["Reviews"],
        summary: "Lista recenzija",
        responses: { "200": { description: "Lista recenzija" } },
      },
    },
    "/api/verifikacije/upload": {
      post: {
        tags: ["Verification"],
        summary: "Upload dokumenta za verifikaciju (TUTOR)",
        security: [{ cookieAuth: [] }],
        requestBody: {
          required: true,
          content: {
            "multipart/form-data": {
              schema: {
                type: "object",
                required: ["file"],
                properties: {
                  file: { type: "string", format: "binary" },
                },
              },
            },
          },
        },
        responses: {
          "201": { description: "Upload uspeo" },
          "413": { description: "Fajl prevelik" },
        },
      },
    },
    "/api/admin/users": {
      get: {
        tags: ["Admin"],
        summary: "Lista svih korisnika (ADMIN)",
        security: [{ cookieAuth: [] }],
        responses: {
          "200": { description: "Lista korisnika" },
          "401": { description: "Nije prijavljen" },
        },
      },
    },
  },
} as const;

export default openApiSpec;
