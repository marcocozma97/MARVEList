FROM maven:3.9-eclipse-temurin-21 AS build
WORKDIR /app
COPY pom.xml .
COPY src ./src
RUN mvn -q -DskipTests package

FROM eclipse-temurin:21-jre
WORKDIR /app
COPY --from=build /app/target/*.jar app.jar
EXPOSE 8080
ENTRYPOINT ["sh", "-c", "if [ -n \"$DATABASE_URL\" ]; then export DB_URL=\"jdbc:postgresql://${DATABASE_URL#*@}\"; fi; exec java -XX:MaxRAMPercentage=75 -jar app.jar"]
