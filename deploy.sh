#!/bin/bash
# deploy.sh - Развертывание и обновление проекта VGP

set -e

PROJECT_DIR="/opt/vgp"
GIT_REPO="https://github.com/Badly89/vgp.git"
BRANCH="main"

# Цвета для вывода
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

print_info() { echo -e "${BLUE}[INFO]${NC} $1"; }
print_success() { echo -e "${GREEN}[SUCCESS]${NC} $1"; }
print_warning() { echo -e "${YELLOW}[WARNING]${NC} $1"; }
print_error() { echo -e "${RED}[ERROR]${NC} $1"; }

# Проверка зависимостей
check_dependencies() {
    print_info "Проверка зависимостей..."
    
    if ! command -v docker &> /dev/null; then
        print_error "Docker не установлен!"
        exit 1
    fi
    
    if ! command -v git &> /dev/null; then
        print_error "Git не установлен!"
        exit 1
    fi
    
    print_success "Все зависимости установлены"
}

# Клонирование или обновление репозитория
clone_or_update() {
    if [ -d "$PROJECT_DIR/.git" ]; then
        print_info "Обновление существующего репозитория..."
        cd "$PROJECT_DIR"
        
        # Сохраняем .env
        if [ -f ".env" ]; then
            cp .env /tmp/vgp_env_backup
            print_info "✅ .env сохранен"
        fi
        
        # Получаем изменения
        git fetch origin "$BRANCH"
        git reset --hard "origin/$BRANCH"
        
        # Восстанавливаем .env
        if [ -f "/tmp/vgp_env_backup" ]; then
            cp /tmp/vgp_env_backup .env
            rm /tmp/vgp_env_backup
            print_info "✅ .env восстановлен"
        fi
        
        print_success "Репозиторий обновлен"
    else
        print_info "Клонирование репозитория..."
        mkdir -p "$PROJECT_DIR"
        git clone "$GIT_REPO" "$PROJECT_DIR"
        cd "$PROJECT_DIR"
        git checkout "$BRANCH"
        print_success "Репозиторий склонирован"
    fi
}

# Создание .env если нет
create_env_if_not_exists() {
    cd "$PROJECT_DIR"
    if [ ! -f ".env" ]; then
        print_warning ".env файл не найден, создаем..."
        cat > .env << 'EOF'
# DTable API настройки
DTABLE_API_TOKEN="a30edef1455300afeac7f5b4d8a221483ea6682a"
DTABLE_BASE_UUID="f3bf6ecc-cbb1-4da1-bfd4-82dd48137b96"
DTABLE_BASE_URL="https://ditable.yanao.ru"

# MariaDB настройки
MYSQL_ROOT_PASSWORD="VgpRoot2024!"
MYSQL_DATABASE="vgp_db"
MYSQL_USER="vgp_user"
MYSQL_PASSWORD="VgpUser2024!"

# Названия таблиц в DTable
TABLE_HOUSING="Почтовый адрес объекта"
TABLE_OWNERS="Собственники жилья"
TABLE_RESIDENTS="Список граждан Вынгапур"
TABLE_ORGANIZATIONS="Место работы"
EOF
        print_warning "⚠️ ОТРЕДАКТИРУЙТЕ .env файл!"
        print_warning "nano /opt/vgp/.env"
        exit 0
    fi
}

# Определение изменившихся сервисов
get_changed_services() {
    cd "$PROJECT_DIR"
    
    if [ "$FORCE_REBUILD" = "true" ]; then
        echo "all"
        return
    fi
    
    if [ ! -f ".last_commit" ]; then
        echo "all"
        return
    fi
    
    LAST_COMMIT=$(cat .last_commit)
    CURRENT_COMMIT=$(git rev-parse HEAD)
    
    if [ "$LAST_COMMIT" = "$CURRENT_COMMIT" ]; then
        echo "none"
        return
    fi
    
    CHANGED_FILES=$(git diff --name-only "$LAST_COMMIT" "$CURRENT_COMMIT" 2>/dev/null || echo "")
    
    SERVICES=""
    
    if echo "$CHANGED_FILES" | grep -q "^backend/"; then
        SERVICES="$SERVICES backend"
    fi
    
    if echo "$CHANGED_FILES" | grep -q "^frontend/"; then
        SERVICES="$SERVICES frontend"
    fi
    
    if echo "$CHANGED_FILES" | grep -q "^nginx/"; then
        SERVICES="$SERVICES nginx"
    fi
    
    if echo "$CHANGED_FILES" | grep -q "^mariadb/"; then
        SERVICES="$SERVICES mariadb"
    fi
    
    if echo "$CHANGED_FILES" | grep -q "docker-compose.yml"; then
        SERVICES="all"
    fi
    
    if [ -z "$SERVICES" ]; then
        echo "config"
    else
        echo "$SERVICES"
    fi
}

# Умная пересборка
smart_rebuild() {
    local services="$1"
    
    cd "$PROJECT_DIR"
    
    case "$services" in
        "none")
            print_info "Нет изменений, пересборка не требуется"
            return
            ;;
        "config")
            print_info "Изменились конфигурационные файлы, перезапуск..."
            docker compose up -d --force-recreate
            ;;
        "all")
            print_info "Полная пересборка всех сервисов..."
            docker compose down
            docker compose build --no-cache
            docker compose up -d
            ;;
        *)
            print_info "Пересборка изменившихся сервисов: $services"
            for service in $services; do
                print_info "  - Пересборка $service..."
                docker compose stop "$service" 2>/dev/null || true
                docker compose rm -f "$service" 2>/dev/null || true
                docker compose build --no-cache "$service"
            done
            docker compose up -d
            ;;
    esac
    
    git rev-parse HEAD > .last_commit
}

# Проверка работоспособности
health_check() {
    print_info "Проверка работоспособности..."
    
    sleep 5
    
    if curl -s http://localhost:8010/health > /dev/null 2>&1; then
        print_success "✅ Бэкенд работает"
    else
        print_error "❌ Бэкенд не отвечает"
    fi
    
    if curl -s http://localhost:87/health > /dev/null 2>&1; then
        print_success "✅ Nginx работает"
    else
        print_warning "⚠️ Nginx не отвечает"
    fi
    
    if docker exec vgp-mariadb mysqladmin ping -h localhost 2>/dev/null; then
        print_success "✅ MariaDB работает"
    else
        print_error "❌ MariaDB не отвечает"
    fi
}

# Показать статус
show_status() {
    cd "$PROJECT_DIR"
    echo ""
    print_info "Статус контейнеров:"
    docker ps --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}" | grep -E "NAMES|vgp" || echo "Нет запущенных контейнеров"
    echo ""
}

# Показать логи
show_logs() {
    cd "$PROJECT_DIR"
    docker compose logs --tail=50
}

# Остановка
stop_all() {
    cd "$PROJECT_DIR"
    print_info "Остановка контейнеров..."
    docker compose down
}

# Запуск
start_all() {
    cd "$PROJECT_DIR"
    print_info "Запуск контейнеров..."
    docker compose up -d
}

# Перезапуск
restart_all() {
    cd "$PROJECT_DIR"
    print_info "Перезапуск контейнеров..."
    docker compose restart
}

# Основная функция
main() {
    FORCE_REBUILD="false"
    ACTION="deploy"
    
    while [[ $# -gt 0 ]]; do
        case $1 in
            --force|-f)
                FORCE_REBUILD="true"
                shift
                ;;
            --status|-s)
                ACTION="status"
                shift
                ;;
            --logs|-l)
                ACTION="logs"
                shift
                ;;
            --stop)
                ACTION="stop"
                shift
                ;;
            --start)
                ACTION="start"
                shift
                ;;
            --restart|-r)
                ACTION="restart"
                shift
                ;;
            --help|-h)
                echo "Использование: $0 [команда]"
                echo ""
                echo "Команды:"
                echo "  (без аргументов)      - обновить код и пересобрать изменившееся"
                echo "  --force, -f           - принудительная полная пересборка"
                echo "  --status, -s          - показать статус контейнеров"
                echo "  --logs, -l            - показать логи"
                echo "  --stop                - остановить все контейнеры"
                echo "  --start               - запустить все контейнеры"
                echo "  --restart, -r         - перезапустить все контейнеры"
                echo "  --help, -h            - эта справка"
                exit 0
                ;;
            *)
                print_error "Неизвестная опция: $1"
                exit 1
                ;;
        esac
    done
    
    case $ACTION in
        status)
            show_status
            exit 0
            ;;
        logs)
            show_logs
            exit 0
            ;;
        stop)
            stop_all
            exit 0
            ;;
        start)
            start_all
            exit 0
            ;;
        restart)
            restart_all
            exit 0
            ;;
    esac
    
    print_info "🚀 Начало развертывания VGP..."
    
    check_dependencies
    clone_or_update
    create_env_if_not_exists
    
    CHANGED=$(get_changed_services)
    print_info "Измененные сервисы: $CHANGED"
    
    smart_rebuild "$CHANGED"
    health_check
    
    echo ""
    print_success "🎉 Развертывание завершено!"
    echo ""
    echo "🌐 Доступ: http://10.87.0.59:87"
    echo "📚 API Docs: http://10.87.0.59:87/docs"
    echo ""
    echo "🔧 Управление:"
    echo "   ./deploy.sh --status  - статус"
    echo "   ./deploy.sh --logs    - логи"
    echo "   ./deploy.sh --force   - полная пересборка"
    echo "   ./deploy.sh --restart - перезапуск"
}

main "$@"