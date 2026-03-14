"""Custom application exceptions."""


class AppException(Exception):
    """Base application exception."""
    
    def __init__(self, message: str, status_code: int = 500):
        self.message = message
        self.status_code = status_code
        super().__init__(self.message)


class NotFoundException(AppException):
    """Resource not found exception."""
    
    def __init__(self, message: str = "Resource not found"):
        super().__init__(message, status_code=404)


class ConflictException(AppException):
    """Resource conflict exception."""
    
    def __init__(self, message: str = "Resource conflict"):
        super().__init__(message, status_code=409)


class ForbiddenException(AppException):
    """Forbidden access exception."""
    
    def __init__(self, message: str = "Access forbidden"):
        super().__init__(message, status_code=403)


class UnauthorizedException(AppException):
    """Unauthorized exception."""
    
    def __init__(self, message: str = "Unauthorized"):
        super().__init__(message, status_code=401)


class ValidationException(AppException):
    """Validation error exception."""
    
    def __init__(self, message: str = "Validation error"):
        super().__init__(message, status_code=422)


class DomainException(AppException):
    """Domain logic exception."""
    
    def __init__(self, message: str = "Domain error"):
        super().__init__(message, status_code=400)
