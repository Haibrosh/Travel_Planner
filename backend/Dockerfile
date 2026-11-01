# ==============================================================================
# Stage 1: Build Spring Boot Application với Maven
# ==============================================================================
FROM maven:3.9.8-eclipse-temurin-17-alpine AS builder
WORKDIR /app

# Copy pom.xml và tải trước các dependency để tận dụng cache của Docker
COPY pom.xml .
RUN mvn dependency:go-offline -B

# Copy toàn bộ mã nguồn backend và tiến hành đóng gói (bỏ qua test khi đóng gói image)
COPY src ./src
RUN mvn clean package -DskipTests

# ==============================================================================
# Stage 2: Chạy ứng dụng với JRE 17 nhẹ gọn
# ==============================================================================
FROM eclipse-temurin:17-jre-alpine
WORKDIR /app

# Copy file jar đã build từ Stage 1
COPY --from=builder /app/target/*.jar app.jar

# Mở cổng 8080 của backend
EXPOSE 8080

# Chạy ứng dụng
ENTRYPOINT ["java", "-jar", "app.jar"]

