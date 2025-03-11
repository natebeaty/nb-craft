from fabric import task
from invoke import run as local
from patchwork.transfers import rsync

# linode
remote_path = "/home/natebeaty/apps/nb-craft"
git_branch = "main"
composer_command = "~/bin/composer.phar"

# deploy
@task(optional=['assets'])
def deploy(c, assets=None):
    update(c)
    composer_update(c)
    if assets:
        build_assets(c)

def update(c):
    c.run("cd {} && git pull origin {}".format(remote_path, git_branch))

def composer_update(c):
    c.run("cd {} && {} install".format(remote_path, composer_command))

def build_assets(c):
    local("rm -rf assets/dist")
    local("bun run gulp --production")
    c.run("mkdir -p {}/web/assets/dist".format(remote_path))
    rsync(c, "assets/dist", "{}/web/assets/".format(remote_path))
    local("bun run gulp")

@task()
def clearcache(c):
  c.run("cd {} && {} ./craft clear-caches/compiled-templates".format(remote_path, php_command))
  c.run("cd {} && {} ./craft clear-caches/data".format(remote_path, php_command))

# local commands
@task
def assets(c):
    local("bun run gulp --production")

@task
def dev(c):
    local("bun run gulp watch")

# @task(optional=['syncdb'])
# def syncstaging(c, syncdb=None):
#     # `fab syncstaging --syncdb` to also restore latest database backup to cosm_staging
#     if syncdb:
#         print('Restoring latest backup to staging...')
#         c.run('/usr/bin/zcat /home/natebeaty/backup/db/`ls -t /home/natebeaty/backup/db/ | head -n1` | /usr/bin/mysql --defaults-extra-file=/home/natebeaty/backup/.my.cnf --defaults-group-suffix=staging cosm_staging')
#     print('Syncing product images...')
#     c.run('/usr/bin/rsync -av --delete --exclude "orig" /var/www/microcosmpublishing.com/public_html/printpreviews/ /var/www/dev.microcosmpublishing.com/public_html/printpreviews/')
#     c.run('/usr/bin/rsync -av --delete --exclude "orig" /var/www/microcosmpublishing.com/public_html/previews/ /var/www/dev.microcosmpublishing.com/public_html/previews/')
