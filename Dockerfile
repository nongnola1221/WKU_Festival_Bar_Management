# Node.js 20 버전의 경량 이미지를 베이스로 사용
FROM node:20-slim

# Railway에서 주입될 환경 변수를 빌드 아규먼트로 받음
ARG REACT_APP_BACKEND_URL
# 빌드 시점에 환경 변수로 설정하여 클라이언트 빌드에 주입되도록 함
ENV REACT_APP_BACKEND_URL=$REACT_APP_BACKEND_URL

# 컨테이너 내부의 작업 디렉토리 설정
WORKDIR /app

# 루트의 package.json과 package-lock.json 복사 및 의존성 설치
COPY package.json package-lock.json ./
RUN npm install

# 클라이언트의 package.json과 package-lock.json 복사 및 의존성 설치
COPY client/package.json client/package-lock.json ./client/
RUN npm install --prefix client

# 클라이언트 앱의 나머지 코드 복사 및 빌드
COPY client/ ./client/
RUN npm run build --prefix client

# 서버 앱의 나머지 코드 복사
COPY server/ ./server/

# 앱이 실행될 포트 노출
EXPOSE 4000

# 애플리케이션 실행 명령어
CMD ["npm", "run", "server"]
