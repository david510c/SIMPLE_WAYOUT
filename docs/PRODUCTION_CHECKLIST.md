# SIMPLE_WAYOUT Production Checklist

## Pre-Deployment

### Code

- [ ] All TypeScript compiles without errors
- [ ] No console.error in production code
- [ ] Environment variables configured
- [ ] applications.json configured for target environment

### Testing

- [ ] Frontend builds successfully (`npm run build`)
- [ ] Backend builds successfully (`npm run build`)
- [ ] Docker image builds successfully (`./build.sh`)
- [ ] Health check endpoint responds (`/health`)
- [ ] Can launch applications
- [ ] Can stop applications
- [ ] Canvas displays correctly
- [ ] Controls work (fullscreen, stop)

### Security

- [ ] CORS configured for production domain
- [ ] Authentication implemented (if needed)
- [ ] HTTPS configured (if needed)
- [ ] Firewall rules configured
- [ ] No sensitive data in logs

### Performance

- [ ] DRI device available (`/dev/dri/renderD128`)
- [ ] Hardware acceleration working
- [ ] Resource limits configured
- [ ] Video encoding optimized

## Deployment

### Docker

- [ ] Image built: `./build.sh`
- [ ] Image tagged: `docker tag simple-wayout:latest registry/simple-wayout:v1.0.0`
- [ ] Image pushed: `docker push registry/simple-wayout:v1.0.0`

### Infrastructure

- [ ] Server has required resources (CPU, RAM, GPU)
- [ ] DRI device accessible
- [ ] Ports open (8080, 8081)
- [ ] Docker/Kubernetes installed
- [ ] Monitoring configured

### Configuration

- [ ] Environment variables set
- [ ] applications.json deployed
- [ ] Compositor configuration correct
- [ ] Network configuration correct

## Post-Deployment

### Verification

- [ ] Service is running: `docker ps` or `kubectl get pods`
- [ ] Health check passes: `curl http://localhost:8080/health`
- [ ] Frontend loads: Open http://your-domain.com
- [ ] Applications list loads
- [ ] Can launch test application
- [ ] Video displays correctly
- [ ] Can stop application

### Monitoring

- [ ] Logs are accessible
- [ ] Health checks configured
- [ ] Alerts configured (if needed)
- [ ] Metrics collection (if needed)

### Documentation

- [ ] Deployment documented
- [ ] Configuration documented
- [ ] Troubleshooting guide available
- [ ] Team trained

## Rollback Plan

### If Deployment Fails

```bash
# Docker Compose
docker-compose down
docker-compose -f docker-compose.old.yml up -d

# Docker Swarm
docker stack rm simple-wayout
docker stack deploy -c docker-compose.old.yml simple-wayout

# Kubernetes
kubectl rollout undo deployment/simple-wayout
```

### Backup

- [ ] Previous version image saved
- [ ] Previous configuration backed up
- [ ] Rollback procedure tested

## Maintenance

### Regular Tasks

- [ ] Check logs weekly
- [ ] Update dependencies monthly
- [ ] Review security quarterly
- [ ] Test disaster recovery quarterly

### Updates

- [ ] Test updates in staging first
- [ ] Have rollback plan ready
- [ ] Update during low-traffic period
- [ ] Monitor after update

## Success Criteria

Deployment is successful if:

- ✅ Service is running and healthy
- ✅ Users can access frontend
- ✅ Applications can be launched
- ✅ Video displays correctly
- ✅ No errors in logs
- ✅ Performance is acceptable
- ✅ Monitoring is working

## Emergency Contacts

- DevOps: [contact]
- Backend: [contact]
- Frontend: [contact]
- Infrastructure: [contact]

## Useful Commands

### Status

```bash
# Docker
docker ps
docker logs simple-wayout

# Docker Compose
docker-compose ps
docker-compose logs

# Kubernetes
kubectl get pods
kubectl logs deployment/simple-wayout
```

### Restart

```bash
# Docker
docker restart simple-wayout

# Docker Compose
docker-compose restart

# Kubernetes
kubectl rollout restart deployment/simple-wayout
```

### Debug

```bash
# Enter container
docker exec -it simple-wayout /bin/bash

# Check processes
docker exec simple-wayout ps aux

# Check network
docker exec simple-wayout netstat -tlnp

# Check files
docker exec simple-wayout ls -la /app
```

---

**Remember:** This checklist ensures nothing is forgotten. Check off each item before deploying to production.
