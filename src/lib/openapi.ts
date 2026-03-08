const serverUrl =
  process.env.NEXT_PUBLIC_APP_URL?.replace(/\/$/, "") ?? "http://localhost:3000";

export function getOpenApiSpec() {
  return {
    openapi: "3.0.3",
    info: {
      title: "Tutor Booking App API",
      version: "1.0.0",
      description:
        "OpenAPI specifikacija za glavne rute aplikacije za povezivanje ucenika i tutora.",
    },
    servers: [
      {
        url: serverUrl,
      },
    ],
    tags: [
      { name: "Auth", description: "Autentifikacija korisnika" },
      { name: "Me", description: "Podaci o prijavljenom korisniku" },
      { name: "Tutors", description: "Pretraga i detalji tutora" },
      { name: "Terms", description: "Kreiranje i pregled termina" },
      { name: "Bookings", description: "Rezervacije termina" },
      { name: "Reviews", description: "Recenzije i moderacija" },
      { name: "Favorites", description: "Favoriti ucenika" },
      { name: "Verification", description: "Verifikacija tutora" },
      { name: "Admin", description: "Administratorske rute" },
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
        TutorProfileUpdate: {
          type: "object",
          properties: {
            biografija: { type: "string", nullable: true },
            cenaPoCasu: { type: "string" },
            languages: {
              type: "array",
              items: {
                type: "object",
                required: ["jezikId", "nivo"],
                properties: {
                  jezikId: { type: "number" },
                  nivo: {
                    type: "string",
                    enum: ["A1", "A2", "B1", "B2", "C1", "C2"],
                  },
                },
              },
            },
          },
        },
        TermCreateRequest: {
          type: "object",
          required: ["datum", "vremeOd", "vremeDo"],
          properties: {
            datum: { type: "string", format: "date" },
            vremeOd: { type: "string", example: "10:00:00" },
            vremeDo: { type: "string", example: "11:00:00" },
          },
        },
        BookingCreateRequest: {
          type: "object",
          required: ["terminId"],
          properties: {
            terminId: { type: "number" },
          },
        },
        ReviewCreateRequest: {
          type: "object",
          required: ["rezervacijaId", "ocena"],
          properties: {
            rezervacijaId: { type: "number" },
            ocena: { type: "number", minimum: 1, maximum: 5 },
            komentar: { type: "string", nullable: true },
          },
        },
        FavoriteRequest: {
          type: "object",
          required: ["tutorId"],
          properties: {
            tutorId: { type: "number" },
          },
        },
        VerificationDecisionRequest: {
          type: "object",
          required: ["status"],
          properties: {
            status: { type: "string", enum: ["ODOBREN", "ODBIJEN"] },
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
            "200": { description: "Uspesna prijava" },
            "401": {
              description: "Pogresni kredencijali",
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
          summary: "Registracija korisnika",
          requestBody: {
            required: true,
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/RegisterRequest" },
              },
            },
          },
          responses: {
            "201": { description: "Korisnik je registrovan" },
            "409": { description: "Email je vec zauzet" },
          },
        },
      },
      "/api/auth/logout": {
        post: {
          tags: ["Auth"],
          summary: "Odjava korisnika",
          responses: {
            "200": { description: "Korisnik je odjavljen" },
          },
        },
      },
      "/api/me": {
        get: {
          tags: ["Me"],
          summary: "Vraca podatke o prijavljenom korisniku",
          security: [{ cookieAuth: [] }],
          responses: {
            "200": { description: "Podaci o korisniku ili null ako nije prijavljen" },
          },
        },
      },
      "/api/tutors": {
        get: {
          tags: ["Tutors"],
          summary: "Lista tutora sa filterima",
          parameters: [
            {
              name: "verified",
              in: "query",
              schema: { type: "boolean" },
            },
            {
              name: "maxPrice",
              in: "query",
              schema: { type: "number" },
            },
            {
              name: "languageId",
              in: "query",
              schema: { type: "number" },
            },
            {
              name: "level",
              in: "query",
              schema: { type: "string", enum: ["A1", "A2", "B1", "B2", "C1", "C2"] },
            },
          ],
          responses: {
            "200": { description: "Lista tutora" },
          },
        },
      },
      "/api/tutors/{id}": {
        get: {
          tags: ["Tutors"],
          summary: "Detalj jednog tutora",
          parameters: [
            {
              name: "id",
              in: "path",
              required: true,
              schema: { type: "number" },
            },
          ],
          responses: {
            "200": { description: "Tutor i jezici" },
          },
        },
        put: {
          tags: ["Tutors"],
          summary: "Azuriranje sopstvenog tutor profila",
          security: [{ cookieAuth: [] }],
          parameters: [
            {
              name: "id",
              in: "path",
              required: true,
              schema: { type: "number" },
            },
          ],
          requestBody: {
            required: true,
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/TutorProfileUpdate" },
              },
            },
          },
          responses: {
            "200": { description: "Profil je azuriran" },
            "403": { description: "Nema prava pristupa" },
          },
        },
      },
      "/api/termini": {
        get: {
          tags: ["Terms"],
          summary: "Pregled termina",
          parameters: [
            {
              name: "tutorId",
              in: "query",
              schema: { type: "number" },
            },
          ],
          responses: {
            "200": { description: "Lista termina" },
          },
        },
        post: {
          tags: ["Terms"],
          summary: "Kreiranje termina",
          security: [{ cookieAuth: [] }],
          requestBody: {
            required: true,
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/TermCreateRequest" },
              },
            },
          },
          responses: {
            "201": { description: "Termin je kreiran" },
          },
        },
      },
      "/api/termini/{id}": {
        delete: {
          tags: ["Terms"],
          summary: "Brisanje sopstvenog termina",
          security: [{ cookieAuth: [] }],
          parameters: [
            {
              name: "id",
              in: "path",
              required: true,
              schema: { type: "number" },
            },
          ],
          responses: {
            "200": { description: "Termin je obrisan" },
          },
        },
      },
      "/api/rezervacije": {
        get: {
          tags: ["Bookings"],
          summary: "Pregled rezervacija",
          parameters: [
            {
              name: "terminId",
              in: "query",
              schema: { type: "number" },
            },
          ],
          responses: {
            "200": { description: "Lista rezervacija" },
          },
        },
        post: {
          tags: ["Bookings"],
          summary: "Kreiranje rezervacije",
          security: [{ cookieAuth: [] }],
          requestBody: {
            required: true,
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/BookingCreateRequest" },
              },
            },
          },
          responses: {
            "201": { description: "Rezervacija je kreirana" },
            "409": { description: "Termin nije slobodan" },
          },
        },
      },
      "/api/rezervacije/{id}": {
        put: {
          tags: ["Bookings"],
          summary: "Otkazivanje rezervacije",
          security: [{ cookieAuth: [] }],
          parameters: [
            {
              name: "id",
              in: "path",
              required: true,
              schema: { type: "number" },
            },
          ],
          requestBody: {
            required: true,
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    status: { type: "string", enum: ["OTKAZANA"] },
                  },
                },
              },
            },
          },
          responses: {
            "200": { description: "Rezervacija je otkazana" },
          },
        },
      },
      "/api/recenzije": {
        get: {
          tags: ["Reviews"],
          summary: "Pregled recenzija",
          parameters: [
            { name: "tutorId", in: "query", schema: { type: "number" } },
            { name: "ucenikId", in: "query", schema: { type: "number" } },
          ],
          responses: {
            "200": { description: "Lista recenzija" },
          },
        },
        post: {
          tags: ["Reviews"],
          summary: "Dodavanje recenzije",
          security: [{ cookieAuth: [] }],
          requestBody: {
            required: true,
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/ReviewCreateRequest" },
              },
            },
          },
          responses: {
            "201": { description: "Recenzija je kreirana" },
          },
        },
      },
      "/api/favoriti": {
        get: {
          tags: ["Favorites"],
          summary: "Lista favorita prijavljenog ucenika",
          security: [{ cookieAuth: [] }],
          responses: {
            "200": { description: "Lista favorita" },
          },
        },
        post: {
          tags: ["Favorites"],
          summary: "Dodavanje tutora u favorite",
          security: [{ cookieAuth: [] }],
          requestBody: {
            required: true,
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/FavoriteRequest" },
              },
            },
          },
          responses: {
            "201": { description: "Tutor je dodat u favorite" },
          },
        },
        delete: {
          tags: ["Favorites"],
          summary: "Uklanjanje tutora iz favorita",
          security: [{ cookieAuth: [] }],
          requestBody: {
            required: true,
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/FavoriteRequest" },
              },
            },
          },
          responses: {
            "200": { description: "Tutor je uklonjen iz favorita" },
          },
        },
      },
      "/api/verifikacije": {
        get: {
          tags: ["Verification"],
          summary: "Pregled zahteva za verifikaciju",
          security: [{ cookieAuth: [] }],
          responses: {
            "200": { description: "Lista zahteva" },
          },
        },
        post: {
          tags: ["Verification"],
          summary: "Slanje zahteva za verifikaciju",
          security: [{ cookieAuth: [] }],
          responses: {
            "201": { description: "Zahtev je kreiran" },
          },
        },
      },
      "/api/verifikacije/{id}": {
        put: {
          tags: ["Verification"],
          summary: "Admin odluka nad zahtevom za verifikaciju",
          security: [{ cookieAuth: [] }],
          parameters: [
            {
              name: "id",
              in: "path",
              required: true,
              schema: { type: "number" },
            },
          ],
          requestBody: {
            required: true,
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/VerificationDecisionRequest" },
              },
            },
          },
          responses: {
            "200": { description: "Zahtev je obradjen" },
          },
        },
      },
      "/api/admin/users": {
        get: {
          tags: ["Admin"],
          summary: "Pregled svih korisnika",
          security: [{ cookieAuth: [] }],
          responses: {
            "200": { description: "Lista korisnika" },
          },
        },
      },
      "/api/admin/users/{id}": {
        put: {
          tags: ["Admin"],
          summary: "Promena statusa korisnickog naloga",
          security: [{ cookieAuth: [] }],
          parameters: [
            {
              name: "id",
              in: "path",
              required: true,
              schema: { type: "number" },
            },
          ],
          requestBody: {
            required: true,
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  required: ["statusNaloga"],
                  properties: {
                    statusNaloga: {
                      type: "string",
                      enum: ["AKTIVAN", "BLOKIRAN"],
                    },
                  },
                },
              },
            },
          },
          responses: {
            "200": { description: "Status naloga je azuriran" },
          },
        },
      },
    },
  };
}
