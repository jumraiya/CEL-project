from . import app

def create_app(test_config=None):
    return app.create_app(test_config)