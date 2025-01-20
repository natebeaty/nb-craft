from fabric import task
from invoke import run as local

remote_path = "/home/natebeaty/apps/nb-craft"
remote_hosts = ["natebeaty@natebeaty.opalstacked.com"]
php_command = "php82"

# set to production
# @task
# def production(c):
#     global remote_hosts, remote_path
#     remote_hosts = ["natebeaty@natebeaty.com"]
#     remote_path = "/home/natebeaty/apps/nb-craft3-production"

# deploy
@task(hosts=remote_hosts)
def deploy(c):
    update(c)
    composer_install(c)
    clear_cache(c)

def update(c):
    c.run("cd {} && git pull".format(remote_path))

def composer_install(c):
    c.run("cd {} && {} ~/bin/composer.phar install".format(remote_path, php_command))

def clear_cache(c):
    c.run("cd {} && {} ./craft clear-caches/compiled-templates".format(remote_path, php_command))
    c.run("cd {} && {} ./craft clear-caches/data".format(remote_path, php_command))

# local commands
@task
def assets(c):
    local("npx gulp --production")

@task
def dev(c):
    local("npx gulp watch")
